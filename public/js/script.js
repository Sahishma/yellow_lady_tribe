function addToCart(productId) {
  //TODO : if user is not loged in then redirect to login
  $.ajax({
    url: "/add-to-cart/" + productId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
        alert("successfully added");
      } 
    },
  });
}
