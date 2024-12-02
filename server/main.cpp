#include <iostream>
#include <stdio.h>
#include <chrono>
#include "generator.hpp"

int main() {
    mask_state::init_mask_state();
    generator::init_sliding_pieces();
    mask_state::cleanup_mask_state();
    return 0;
}