import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  createStar: async function() {
    try {
      // Get the contract method for creating a star
      const { createStar } = this.meta.methods;

      // Get the star name and ID from input fields
      const name = document.getElementById("starName").value;
      const id = document.getElementById("starId").value;

      // Send a transaction to create the star, specifying the sender's account
      await createStar(name, id).send({ from: this.account });

      // Log the account that created the star
      console.log('Star created by account:', this.account);

      // Update the UI status with the new star owner
      App.setStatus("New Star Owner is " + this.account + ".");
    } catch (error) {
      // Handle any errors that occur during star creation
      console.error('Error while creating star:', error);
      App.setStatus("Error creating star: " + error.message);
    }
  },

  // Implement Task 4 Modify the front end of the DAPP
  // Function to look up star information based on token ID
  lookUp: async function () {
    try {
      // Get the contract method for looking up star information
      const { lookUptokenIdToStarInfo } = this.meta.methods;

      // Get the star ID from the input field with id "lookid"
      const id = document.getElementById("lookid").value;

      // Call the contract method to retrieve the star name associated with the given ID
      const starName = await lookUptokenIdToStarInfo(id).call();

      // Check if a star was found
      let status;
      if (starName === '') {
        status = 'Error! No star found with the selected ID: ' + id;
      } else {
        status = 'Found star [' + starName + '] with the selected ID: ' + id;
      }

      // Update the status on the UI
      App.setStatus(status);

      // Log the result to the console
      console.log(status);
    } catch (error) {
      // Handle any errors that occur during the lookup
      console.error('Error while looking up star:', error);
    }
  },

  // Define a function for updating the UI status
  setStatus: function (message) {
    // Update the UI element with id "status" to display the provided message
    document.getElementById("status").innerHTML = message;
  }
};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    // Use MetaMask's provider
    console.log("Using MetaMask's provider.");
    App.web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.enable(); // Get permission to access accounts
      console.log("MetaMask permission granted.");
    } catch (error) {
      console.error("MetaMask permission denied:", error);
    }
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live.");
    // Fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
    console.log("Using fallback HTTP provider.");
  }

  App.start();
});
