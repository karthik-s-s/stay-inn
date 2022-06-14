/* eslint-disable no-undef */

$(document).ready(function () {
  $('#signup-form').validate({
    rules:
       {
         user: {

           required: true,
           minlength: 4,
           maxlength: 20,
           lettersonly: true

         },
         mobile: {
           minlength: 10,
           required: true
         },

         email: {
           required: true,
           email: true
         },
         password: {
           required: true,
           minlength: 4,
           maxlength: 10
         }

       }

  })
})
