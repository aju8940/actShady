// Download the helper library from https://www.twilio.com/docs/node/install
// Set environment variables for your credentials
// Read more at http://twil.io/secure

const accountSid = "AC00b266a25beea57c9ab15632189615f3";
const authToken = '9cab22d5f7a9bef3bfa7f932c373f946'
const serviceSid = "VAda021f22e6b4da039da57cd4a990b278";
const client = require("twilio")(accountSid, authToken);



module.exports = { 
  sendOtp : (mobile) =>{
      return new Promise((resolve, reject) =>{
          client.verify.v2.services(serviceSid)
          .verifications
          .create({to:`+91${mobile}`, channel: 'sms'})
          .then((verification) => {
              console.log(verification.status)
              resolve(verification.status)
          });
      })
  },


  verifyOtp : (mobile, otp) =>{
    console.log(otp,mobile);
    return new Promise((resolve, reject) =>{
        client.verify.v2.services(serviceSid)
        .verificationChecks
        .create({to: `+91${mobile}`, code: `${otp}`})
        .then(verification_check => {
            console.log(verification_check.status)              
                resolve(verification_check.status);                
        });
    })
},

}