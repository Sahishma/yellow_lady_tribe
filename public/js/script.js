
function addToCart(productId) {
  // Check if user is logged in
  $.ajax({
    url: "/check-login",
    method: "get",
    success: (response) => {
      if (response.loggedIn) {
        // User is logged in, add to cart
        $.ajax({
          url: "/add-to-cart/" + productId,
          method: "get",
          success: (response) => {
            if (response.status) {
              let count = $("#cart-count").html();
              count = parseInt(count) + 1;
              $("#cart-count").html(count);
              alert("Product added successfully");
            }
          },
        });
      } else {
        // User is not logged in, redirect to login page
        window.location.href = "/login";
      }
    },
  });
}





