
// function addToCart(productId) {
//   // Check if user is logged in
//   $.ajax({
//     url: "/check-login",
//     method: "get",
//     success: (response) => {
//       if (response.loggedIn) {
//         // User is logged in, add to cart
//         $.ajax({
//           url: "/add-to-cart/" + productId,
//           method: "get",
//           success: (response) => {
//             if (response.status) {
//               let count = $("#cart-count").html();
//               count = parseInt(count) + 1;
//               $("#cart-count").html(count);
//               alert("Product added successfully");
//             }
//           },
//         });
//       } else {
//         // User is not logged in, redirect to login page
//         window.location.href = "/login";
//       }
//     },
//   });
// }

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

              Swal.fire({
                title: "Product Added",
                text: "Product added to your cart successfully.",
                icon: "success",
                confirmButtonText: "Go to Cart",
                showCancelButton: true,
                cancelButtonText: "Continue Shopping",
              }).then((result) => {
                if (result.isConfirmed) {
                  window.location.href = "/cart";
                }
              });
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





