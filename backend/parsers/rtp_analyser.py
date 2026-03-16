import math


def calculate_jitter_series(timestamps: list[float]) -> list[float]:
    """
    RFC 3550 jitter estimate from packet arrival timestamps.
    Returns list of instantaneous jitter values in milliseconds.
    Assumes 20ms packet time (G.711/G.729 default).
    """
    if len(timestamps) < 2:
        return []
    jitter_ms = 0.0
    series = []
    for i in range(1, len(timestamps)):
        d = abs((timestamps[i] - timestamps[i - 1]) * 1000 - 20)
        jitter_ms += (d - jitter_ms) / 16
        series.append(round(jitter_ms, 2))
    # Downsample to at most 100 points
    if len(series) > 100:
        step = len(series) // 100
        series = series[::step][:100]
    return series


def calculate_mos(
    avg_jitter_ms: float,
    packet_loss_pct: float,
    latency_ms: float = 40.0,
) -> float:
    """
    E-Model simplified MOS calculation (ITU-T G.107).
    Returns MOS score in range 1.0 – 4.5.
    """
    R = 93.2
    # Delay impairment (Id)
    if latency_ms < 160:
        Id = 0.024 * latency_ms + 0.11 * (latency_ms - 177.3) * (latency_ms > 177.3)
    else:
        Id = 0.024 * latency_ms + 0.11 * (latency_ms - 177.3)
    # Packet-loss impairment
    Ie_eff = 7 + (30 * math.log(1 + 15 * (packet_loss_pct / 100)))
    # Jitter impairment (approximation)
    Ij = min(10, avg_jitter_ms / 5)
    R = R - Id - Ie_eff - Ij
    R = max(0.0, min(100.0, R))
    if R <= 0:
        return 1.0
    mos = 1 + 0.035 * R + 7e-6 * R * (R - 60) * (100 - R)
    return round(max(1.0, min(4.5, mos)), 2)
