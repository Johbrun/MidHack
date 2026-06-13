#!/usr/bin/env python3
"""Convertit un rapport JSON OWASP ZAP en SARIF 2.1.0.

Usage: zap-to-sarif.py <zap.json> <out.sarif> [target_url]

ZAP ne produit pas de SARIF nativement : on mappe chaque alerte ZAP vers
une règle SARIF, et chaque instance d'alerte vers un résultat localisé sur
son URI.
"""
import json
import sys

# riskcode ZAP -> niveau SARIF
RISK_TO_LEVEL = {"3": "error", "2": "warning", "1": "note", "0": "none"}


def main():
    if len(sys.argv) < 3:
        print("usage: zap-to-sarif.py <zap.json> <out.sarif> [target_url]",
              file=sys.stderr)
        return 2

    src, dst = sys.argv[1], sys.argv[2]
    target = sys.argv[3] if len(sys.argv) > 3 else ""

    with open(src, encoding="utf-8") as fh:
        report = json.load(fh)

    rules = {}      # ruleId -> rule object (déduplication)
    rule_index = {}  # ruleId -> index dans la liste de règles
    results = []

    for site in report.get("site", []):
        for alert in site.get("alerts", []):
            plugin_id = str(alert.get("pluginid", "zap-unknown"))
            level = RISK_TO_LEVEL.get(str(alert.get("riskcode", "0")), "warning")
            name = alert.get("alert") or alert.get("name") or plugin_id

            if plugin_id not in rules:
                rule_index[plugin_id] = len(rules)
                cwe = alert.get("cweid")
                rules[plugin_id] = {
                    "id": plugin_id,
                    "name": name,
                    "shortDescription": {"text": name},
                    "fullDescription": {
                        "text": _strip(alert.get("desc", name))
                    },
                    "helpUri": (alert.get("reference") or "").split("\n")[0],
                    "properties": {
                        "tags": ["security", "dast", "zap"]
                        + ([f"CWE-{cwe}"] if cwe and cwe != "-1" else []),
                        "security-severity": _severity_score(
                            alert.get("riskcode", "0")
                        ),
                        "solution": _strip(alert.get("solution", "")),
                    },
                }

            instances = alert.get("instances") or [{}]
            for inst in instances:
                uri = inst.get("uri") or site.get("@name") or target
                msg_parts = [_strip(alert.get("desc", name))]
                if inst.get("param"):
                    msg_parts.append(f"Paramètre : {inst['param']}")
                if inst.get("evidence"):
                    msg_parts.append(f"Preuve : {inst['evidence']}")
                if inst.get("method"):
                    msg_parts.append(f"Méthode : {inst['method']}")

                results.append({
                    "ruleId": plugin_id,
                    "ruleIndex": rule_index[plugin_id],
                    "level": level,
                    "message": {"text": "  ".join(p for p in msg_parts if p)},
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {"uri": uri},
                            "region": {"startLine": 1},
                        }
                    }],
                })

    sarif = {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "OWASP ZAP",
                    "informationUri": "https://www.zaproxy.org/",
                    "version": str(report.get("@version", "unknown")),
                    "rules": list(rules.values()),
                }
            },
            "results": results,
        }],
    }

    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(sarif, fh, indent=2, ensure_ascii=False)

    print(f"ZAP→SARIF : {len(results)} résultat(s), "
          f"{len(rules)} règle(s) -> {dst}", file=sys.stderr)
    return 0


def _strip(html):
    """Retire les balises HTML grossières des descriptions ZAP."""
    import re
    text = re.sub(r"<[^>]+>", " ", html or "")
    return re.sub(r"\s+", " ", text).strip()


def _severity_score(riskcode):
    """riskcode ZAP -> score CVSS-like pour GitHub code scanning."""
    return {"3": "8.0", "2": "5.0", "1": "3.0", "0": "0.0"}.get(
        str(riskcode), "5.0"
    )


if __name__ == "__main__":
    sys.exit(main())
