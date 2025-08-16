const std = @import("std");

const alphabet = "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const default_id_len = 15;

const default_mask = computeMask(alphabet.len);

const rng_step_buffer_len_sufficient_for_default_length_ids = computeSufficientRngStepBufferLengthFor(default_id_len);

fn computeSufficientRngStepBufferLengthFor(max_id_len: usize) usize {
    @setEvalBranchQuota(2500);
    var max_step_buffer_len: usize = 0;
    var i: u9 = 1;
    while (i <= std.math.maxInt(u8)) : (i += 1) {
        const alphabet_len: u8 = @truncate(i);
        const step_buffer_len = computeRngStepBufferLength(max_id_len, alphabet_len);

        if (step_buffer_len > max_step_buffer_len) {
            max_step_buffer_len = step_buffer_len;
        }
    }

    return max_step_buffer_len;
}

fn computeMask(alphabet_len: u8) u8 {
    std.debug.assert(alphabet_len > 0);

    const clz: u5 = @clz(@as(u31, (alphabet_len - 1) | 1));
    const mask = (@as(u32, 2) << (31 - clz)) - 1;
    const result: u8 = @truncate(mask);
    return result;
}

fn computeRngStepBufferLength(id_len: usize, alphabet_len: u8) usize {
    const mask: f64 = @floatFromInt(computeMask(alphabet_len));
    const id_size: f64 = @floatFromInt(id_len);
    const alphabet_size: f64 = @floatFromInt(alphabet_len);
    const step_buffer_len = @ceil(1.6 * mask * id_size / alphabet_size);
    const result: usize = @intFromFloat(step_buffer_len);

    return result;
}

pub fn generate(rng: std.Random) [default_id_len]u8 {
    var nanoid: [default_id_len]u8 = undefined;
    var step_buffer: [rng_step_buffer_len_sufficient_for_default_length_ids]u8 = undefined;

    const necessary_step_buffer_len = computeRngStepBufferLength(default_id_len, alphabet.len);
    const actual_step_buffer = step_buffer[0..necessary_step_buffer_len];

    var result_iter: usize = 0;
    while (true) {
        rng.bytes(actual_step_buffer);

        for (actual_step_buffer) |it| {
            const alphabet_index = it & default_mask;

            if (alphabet_index >= alphabet.len) {
                continue;
            }

            nanoid[result_iter] = alphabet[alphabet_index];

            if (result_iter == default_id_len - 1) {
                return nanoid;
            } else {
                result_iter += 1;
            }
        }
    }

    return nanoid;
}
