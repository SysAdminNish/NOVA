import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from parsers.sip_log_parser import parse_sip_log

SAMPLE_LOG = """
INVITE sip:bob@example.com SIP/2.0
Via: SIP/2.0/UDP 192.168.1.10:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 1 INVITE

SIP/2.0 100 Trying
Via: SIP/2.0/UDP 192.168.1.20:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 1 INVITE

SIP/2.0 180 Ringing
Via: SIP/2.0/UDP 192.168.1.20:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 1 INVITE

SIP/2.0 200 OK
Via: SIP/2.0/UDP 192.168.1.20:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 1 INVITE

ACK sip:bob@example.com SIP/2.0
Via: SIP/2.0/UDP 192.168.1.10:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 1 ACK

BYE sip:bob@example.com SIP/2.0
Via: SIP/2.0/UDP 192.168.1.10:5060
Call-ID: test-call-001@192.168.1.10
From: "Alice" <sip:alice@example.com>
To: <sip:bob@example.com>
CSeq: 2 BYE
"""

FAILED_LOG = """
INVITE sip:charlie@example.com SIP/2.0
Via: SIP/2.0/UDP 10.0.0.1:5060
Call-ID: test-call-002@10.0.0.1
From: <sip:diana@example.com>
To: <sip:charlie@example.com>
CSeq: 1 INVITE

SIP/2.0 486 Busy Here
Via: SIP/2.0/UDP 10.0.0.2:5060
Call-ID: test-call-002@10.0.0.1
From: <sip:diana@example.com>
To: <sip:charlie@example.com>
CSeq: 1 INVITE
"""


class TestParseSipLog:
    def test_basic_call_count(self):
        result = parse_sip_log(SAMPLE_LOG)
        assert result.stats.total_calls == 1

    def test_successful_call_status(self):
        result = parse_sip_log(SAMPLE_LOG)
        call = result.calls[0]
        assert call.status == "200 OK"

    def test_correct_message_count(self):
        result = parse_sip_log(SAMPLE_LOG)
        assert len(result.calls[0].messages) == 6

    def test_from_uri_extracted(self):
        result = parse_sip_log(SAMPLE_LOG)
        assert "alice" in result.calls[0].from_uri

    def test_to_uri_extracted(self):
        result = parse_sip_log(SAMPLE_LOG)
        assert "bob" in result.calls[0].to_uri

    def test_failed_call_detected(self):
        result = parse_sip_log(FAILED_LOG)
        assert result.stats.failed_calls == 1

    def test_error_extracted(self):
        result = parse_sip_log(FAILED_LOG)
        assert len(result.errors) == 1
        assert result.errors[0].code == 486
        assert result.errors[0].reason == "Busy Here"

    def test_empty_log_returns_valid_response(self):
        result = parse_sip_log("")
        assert result.stats.total_calls == 0
        assert result.calls == []

    def test_no_call_id_blocks_ignored(self):
        log_no_callid = "INVITE sip:nobody@example.com SIP/2.0\nFrom: <sip:x@y.com>\nTo: <sip:z@y.com>\n"
        result = parse_sip_log(log_no_callid)
        assert result.stats.total_calls == 0

    def test_multiple_calls(self):
        combined = SAMPLE_LOG + "\n" + FAILED_LOG
        result = parse_sip_log(combined)
        assert result.stats.total_calls == 2
        assert result.stats.successful_calls == 1
        assert result.stats.failed_calls == 1
