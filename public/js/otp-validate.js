const form = document.getElementById("otpValidate_form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  validateInputs();
});

const validateInputs = () => {
  let isError = false;

  const otp = document.getElementById("otp").value;
  if (otp == "") {
    document.getElementById("error_msg_otp").innerHTML =
      '<span style="color:red"> OTP is required </span> ';
    isError = true;
  } else if (otp.length !== 4) {
    document.getElementById("error_msg_otp").innerHTML =
      '<span style="color:red"> OTP number must have 4 digits </span> ';
    isError = true;
  } else {
    document.getElementById("error_msg_otp").innerHTML = "";
  }

  if (!isError) {
    form.submit();
  }
};
