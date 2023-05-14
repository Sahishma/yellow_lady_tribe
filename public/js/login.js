const loginForm = document.getElementById("login_form");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  validateInputs();
});

const validateInputs = () => {
  let isError = false;


    //validating email

  const email = document.getElementById("email").value;
  if (email == "") {
    document.getElementById("error_msg_email").innerHTML =
      '<span style="color:red">Email is required</span>';
    isError = true;
  } else {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var regex_result = regex.test(email);

    if (regex_result) {
      document.getElementById("error_msg_email").innerHTML = "";
    } else {
      document.getElementById("error_msg_email").innerHTML =
        '<span style="color:red">Email is not valid </span>';
      isError = true;
    }
  }


    //validating password

    const password = document .getElementById("password").value;
    if(password == ''){
        document.getElementById("error_msg_password").innerHTML = '<span style= "color:red">Password is required.</span>';
        isError = true;
    }else if(password.length < 8){
        document.getElementById("error_msg_password").innerHTML =
        '<span style="color:red"> Password must be at least 8 character</span> ';
        isError = true;
      } else {
        document.getElementById("error_msg_password").innerHTML = "";
      }


    if (!isError) {
      loginForm.submit();
    } 
};
