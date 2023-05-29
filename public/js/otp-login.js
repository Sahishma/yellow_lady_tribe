const form = document.getElementById("otpLogin_form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  validateInputs();
});

const validateInputs = () => {
  let isError = false;

  // validating phoneno.

  const phoneNumber = document.getElementById("phoneNumber").value;
  if (phoneNumber == "") {
    document.getElementById("error_msg_phoneNumber").innerHTML =
      '<span style="color:red">Phone number is required</span>';
    isError = true;
  } else if (phoneNumber.length !== 10) {
    document.getElementById("error_msg_phoneNumber").innerHTML =
      '<span style="color:red"> Phone number must have 10 digits </span> ';
    isError = true;
  } else if (!/^[0-9]+$/.test(phoneNumber)) {
    
    document.getElementById("error_msg_phoneNumber").innerHTML =
      '<span style="color:red">Phone Number should contain digits only</span>';
    isError = true;
  }  else {
    document.getElementById("error_msg_phoneNumber").innerHTML = "";
  }

  if (!isError) {
    form.submit();
  }
};
