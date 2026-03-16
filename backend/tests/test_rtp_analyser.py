import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from parsers.rtp_analyser import calculate_mos, calculate_jitter_series


class TestCalculateMos:
    def test_perfect_conditions(self):
        mos = calculate_mos(0.0, 0.0)
        assert mos >= 4.0, "Zero jitter/loss should yield high MOS"

    def test_high_loss_degrades_mos(self):
        mos_low = calculate_mos(5.0, 1.0)
        mos_high = calculate_mos(5.0, 20.0)
        assert mos_high < mos_low

    def test_high_jitter_degrades_mos(self):
        mos_low = calculate_mos(5.0, 0.0)
        mos_high = calculate_mos(100.0, 0.0)
        assert mos_high < mos_low

    def test_mos_floor(self):
        mos = calculate_mos(500.0, 100.0)
        assert mos >= 1.0

    def test_mos_ceiling(self):
        mos = calculate_mos(0.0, 0.0)
        assert mos <= 4.5

    def test_return_type(self):
        mos = calculate_mos(10.0, 2.0)
        assert isinstance(mos, float)


class TestCalculateJitterSeries:
    def test_empty_returns_empty(self):
        assert calculate_jitter_series([]) == []

    def test_single_returns_empty(self):
        assert calculate_jitter_series([1.0]) == []

    def test_two_timestamps_returns_one(self):
        result = calculate_jitter_series([0.0, 0.02])
        assert len(result) == 1

    def test_all_values_non_negative(self):
        timestamps = [i * 0.02 for i in range(200)]
        result = calculate_jitter_series(timestamps)
        assert all(v >= 0 for v in result)

    def test_downsampled_to_100(self):
        timestamps = [i * 0.02 for i in range(500)]
        result = calculate_jitter_series(timestamps)
        assert len(result) <= 100

    def test_perfect_timing_low_jitter(self):
        # Perfectly spaced packets at 20ms should produce near-zero jitter
        timestamps = [i * 0.02 for i in range(50)]
        result = calculate_jitter_series(timestamps)
        assert max(result) < 5.0
