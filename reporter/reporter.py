#!/usr/bin/env python3
"""Reads payments-service events and validates them against the service's
committed JSON Schema contracts. No TypeScript anywhere in sight.

Usage: python3 reporter.py [events.ndjson]   (default: ../payments-service/events.ndjson)
       python3 reporter.py --check           (self-check)
"""
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

CONTRACTS = Path(__file__).resolve().parent.parent / "payments-service" / "contracts" / "events"
VALIDATORS = {
    path.stem: Draft202012Validator(json.loads(path.read_text()))
    for path in CONTRACTS.glob("*.json")
}


def report(line: str) -> str:
    event = json.loads(line)
    validator = VALIDATORS.get(event.get("type", ""))
    if validator is None:
        return f"UNKNOWN event type: {event.get('type')!r}"
    errors = sorted(validator.iter_errors(event), key=lambda e: e.json_path)
    if errors:
        return f"INVALID {event['type']}: {errors[0].json_path}: {errors[0].message}"
    payment = event.get("payment", {})
    detail = f" {payment['amount']} {payment['currency']}" if payment else ""
    return f"OK {event['type']}{detail}"


def self_check() -> None:
    good = {
        "type": "payment.completed",
        "payment": {
            "id": "p1", "amount": 10.5, "currency": "GBP",
            "status": "completed", "createdAt": "2026-07-27T12:00:00Z",
        },
        "settledAt": "2026-07-27T12:00:00Z",
    }
    bad = dict(good, payment=dict(good["payment"], amount=-1))
    assert report(json.dumps(good)).startswith("OK"), "valid event rejected"
    assert report(json.dumps(bad)).startswith("INVALID"), "off-contract event accepted"
    print("reporter self-check passed")


if __name__ == "__main__":
    if "--check" in sys.argv:
        self_check()
        sys.exit(0)
    log = Path(sys.argv[1]) if len(sys.argv) > 1 else CONTRACTS.parent.parent / "events.ndjson"
    for line in log.read_text().splitlines():
        print(report(line))
