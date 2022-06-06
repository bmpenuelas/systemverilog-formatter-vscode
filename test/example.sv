// Example module for testing automatic formatting

 module test_module (
input  wire din_A ,   // Input A
      input  wire   din_B,       // Input B
 input    wire  sel,    // Selector
   output wire   dout      // Output
);

    assign   mux_out   = ( sel) ?  din_1  :din_0 ;

  endmodule
