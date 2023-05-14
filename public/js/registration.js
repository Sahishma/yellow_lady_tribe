const form = document.getElementById("register_form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  validateInputs();
});

const validateInputs = () => {
  let isError = false;

  //validating username
  const username = document.getElementById("username").value;
  if (username == "") {
    document.getElementById("error_msg_username").innerHTML =
      '<span style="color:red"> Username is required </span> ';
    isError = true;
  } else {
    document.getElementById("error_msg_username").innerHTML = "";
  }

  //validating email
  const email = document.getElementById("email").value;
  if (email == "") {
    document.getElementById("error_msg_email").innerHTML =
      '<span style="color:red"> Email is required </span> ';
    isError = true;
  } else {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var regex_result = regex.test(email);

    if (regex_result) {
      document.getElementById("error_msg_email").innerHTML = "";
    } else {
      document.getElementById("error_msg_email").innerHTML =
        '<span style="color:red"> Email is not valid </span> ';
      isError = true;
    }
  }

  //validating phoneNo.


  const phoneNumber = document.getElementById("phone").value;
if (phoneNumber == "") {
  document.getElementById("error_msg_phone").innerHTML =
    '<span style="color:red"> Phone Number is required </span> ';
  isError = true;
} else if (phoneNumber.length != 10) {
  document.getElementById("error_msg_phone").innerHTML =
    '<span style="color:red"> Phone number must have 10 digits </span> ';
  isError = true;
} else if (!/^[0-9]+$/.test(phoneNumber)) {
  document.getElementById("error_msg_phone").innerHTML =
    '<span style="color:red"> Phone Number should contain digits only </span> ';
  isError = true;
} else {
  document.getElementById("error_msg_phone").innerHTML = "";
}


  // const phoneNumber = document.getElementById("phone").value;
  // if (phoneNumber == "") {
  //   document.getElementById("error_msg_phone").innerHTML =
  //     '<span style="color:red"> Phone Number is required </span> ';
  //   isError = true;
  // } else if(phoneNumber.length < 10){
  //   document.getElementById("error_msg_phone").innerHTML =
  //   '<span style="color:red">invalid Phone number </span> ';
  //   isError = true;
  // }else if (!/^[0-9]+$/.test(phoneNumber)) {
  //   document.getElementById("error_msg_phone").innerHTML =
  //     '<span style="color:red"> Phone Number should contain digits only </span> ';
  //   isError = true;
  // }else {
  //   document.getElementById("error_msg_phone").innerHTML = "";
    
  // }


  //validating Password

  const password = document.getElementById("password").value;
  if (password == "") {
    document.getElementById("error_msg_password").innerHTML =
      '<span style="color:red"> Password is required </span> ';
    isError = true;
  } else if(password.length < 8){
    document.getElementById("error_msg_password").innerHTML =
    '<span style="color:red">Password must be at least 8 character</span> ';
    isError = true;
  } else {
    document.getElementById("error_msg_password").innerHTML = "";
  }

  //validating Password2

  const password2 = document.getElementById("password2").value;
  if (password2 == "") {
    document.getElementById("error_msg_password2").innerHTML =
      '<span style="color:red"> Please Confirm password </span> ';
    isError = true;
  } else if(password != password2){
    document.getElementById("error_msg_password2").innerHTML =
      '<span style="color:red"> confirmed password not matching </span> ';
    isError = true;
  } else {
    document.getElementById("error_msg_password2").innerHTML = "";
  }

  // submit the form if there are no errors
  if (!isError) {
    form.submit();
  }
};
