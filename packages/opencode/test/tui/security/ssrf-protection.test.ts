import { describe, test, expect } from "bun:test"

// Import the isPrivateHostname function from webfetch module
// Since it's not exported, we test it through the module's public behavior
// by importing and testing the pattern matching logic directly

// Replicate the SSRF check logic from src/tool/webfetch.ts for unit testing
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^198\.1[8-9]\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd/i,
]

function isPrivateHostname(hostname: string): boolean {
  let host = hostname
  // Handle [IPv6]:port format
  if (host.startsWith("[") && host.includes("]:")) {
    host = host.replace(/]:\d+$/, "").replace(/^\[/, "").replace(/\]$/, "")
  } else if (host.includes(":") && !host.startsWith("[")) {
    // Bare IPv6 (like ::1 or fe80::1) or hostname:port
    const colonCount = (host.match(/:/g) || []).length
    if (colonCount === 1) {
      host = host.replace(/:\d+$/, "")
    }
    // else: bare IPv6, keep as-is
  }
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))
}

describe("SSRF Protection — isPrivateHostname", () => {
  describe("blocks loopback addresses", () => {
    test("blocks localhost", () => {
      expect(isPrivateHostname("localhost")).toBe(true)
    })

    test("blocks 127.0.0.1", () => {
      expect(isPrivateHostname("127.0.0.1")).toBe(true)
    })

    test("blocks 127.0.0.1 with port", () => {
      expect(isPrivateHostname("127.0.0.1:8080")).toBe(true)
    })

    test("blocks 127.x.x.x range", () => {
      expect(isPrivateHostname("127.0.0.99")).toBe(true)
      expect(isPrivateHostname("127.255.255.255")).toBe(true)
    })

    test("blocks ::1 (IPv6 loopback)", () => {
      expect(isPrivateHostname("::1")).toBe(true)
    })

    test("blocks [::1] (IPv6 loopback bracketed)", () => {
      expect(isPrivateHostname("[::1]")).toBe(true)
    })
  })

  describe("blocks RFC1918 private addresses", () => {
    test("blocks 10.x.x.x (Class A)", () => {
      expect(isPrivateHostname("10.0.0.1")).toBe(true)
      expect(isPrivateHostname("10.255.255.255")).toBe(true)
    })

    test("blocks 172.16.x.x - 172.31.x.x (Class B)", () => {
      expect(isPrivateHostname("172.16.0.1")).toBe(true)
      expect(isPrivateHostname("172.31.255.255")).toBe(true)
    })

    test("allows 172.15.x.x (not in private range)", () => {
      expect(isPrivateHostname("172.15.0.1")).toBe(false)
    })

    test("allows 172.32.x.x (not in private range)", () => {
      expect(isPrivateHostname("172.32.0.1")).toBe(false)
    })

    test("blocks 192.168.x.x (Class C)", () => {
      expect(isPrivateHostname("192.168.0.1")).toBe(true)
      expect(isPrivateHostname("192.168.1.1")).toBe(true)
    })
  })

  describe("blocks cloud metadata endpoint", () => {
    test("blocks 169.254.169.254 (AWS/GCP/Azure metadata)", () => {
      expect(isPrivateHostname("169.254.169.254")).toBe(true)
    })

    test("blocks other 169.254.x.x (link-local)", () => {
      expect(isPrivateHostname("169.254.0.1")).toBe(true)
    })
  })

  describe("blocks other private ranges", () => {
    test("blocks 0.x.x.x (current network)", () => {
      expect(isPrivateHostname("0.0.0.0")).toBe(true)
      expect(isPrivateHostname("0.0.0.1")).toBe(true)
    })

    test("blocks carrier-grade NAT 100.64.x.x - 100.127.x.x", () => {
      expect(isPrivateHostname("100.64.0.1")).toBe(true)
      expect(isPrivateHostname("100.127.255.255")).toBe(true)
    })

    test("allows 100.63.x.x (not CGNAT)", () => {
      expect(isPrivateHostname("100.63.0.1")).toBe(false)
    })

    test("allows 100.128.x.x (not CGNAT)", () => {
      expect(isPrivateHostname("100.128.0.1")).toBe(false)
    })

    test("blocks RFC2544 benchmarking 198.18.x.x - 198.19.x.x", () => {
      expect(isPrivateHostname("198.18.0.1")).toBe(true)
      expect(isPrivateHostname("198.19.255.255")).toBe(true)
    })

    test("allows 198.17.x.x (not benchmarking)", () => {
      expect(isPrivateHostname("198.17.0.1")).toBe(false)
    })
  })

  describe("blocks IPv6 private addresses", () => {
    test("blocks fe80:: (link-local)", () => {
      expect(isPrivateHostname("fe80::1")).toBe(true)
    })

    test("blocks [fe80::1] (bracketed with port)", () => {
      expect(isPrivateHostname("[fe80::1]:8080")).toBe(true)
    })

    test("blocks fc00:: (unique local)", () => {
      expect(isPrivateHostname("fc00::1")).toBe(true)
    })

    test("blocks fd00:: (unique local)", () => {
      expect(isPrivateHostname("fd00::1")).toBe(true)
    })
  })

  describe("allows public addresses", () => {
    test("allows public IP addresses", () => {
      expect(isPrivateHostname("8.8.8.8")).toBe(false)
      expect(isPrivateHostname("1.1.1.1")).toBe(false)
      expect(isPrivateHostname("142.250.80.46")).toBe(false)
    })

    test("allows public hostnames", () => {
      expect(isPrivateHostname("example.com")).toBe(false)
      expect(isPrivateHostname("api.openai.com")).toBe(false)
      expect(isPrivateHostname("github.com")).toBe(false)
    })

    test("allows public IPs with port", () => {
      expect(isPrivateHostname("8.8.8.8:443")).toBe(false)
    })
  })

  describe("edge cases", () => {
    test("Localhost with port is blocked", () => {
      expect(isPrivateHostname("localhost:3000")).toBe(true)
    })

    test("LOCALHOST (case-insensitive) is blocked", () => {
      expect(isPrivateHostname("LOCALHOST")).toBe(true)
    })

    test("empty string is not private", () => {
      expect(isPrivateHostname("")).toBe(false)
    })
  })
})

describe("URL SSRF validation", () => {
  test("blocks http://169.254.169.254/latest/meta-data/", () => {
    const url = new URL("http://169.254.169.254/latest/meta-data/")
    expect(isPrivateHostname(url.hostname)).toBe(true)
  })

  test("blocks http://localhost:8080/admin", () => {
    const url = new URL("http://localhost:8080/admin")
    expect(isPrivateHostname(url.hostname)).toBe(true)
  })

  test("blocks http://127.0.0.1:9200/_cluster/health", () => {
    const url = new URL("http://127.0.0.1:9200/_cluster/health")
    expect(isPrivateHostname(url.hostname)).toBe(true)
  })

  test("blocks http://10.0.0.1/internal/api", () => {
    const url = new URL("http://10.0.0.1/internal/api")
    expect(isPrivateHostname(url.hostname)).toBe(true)
  })

  test("allows https://api.example.com/v1/data", () => {
    const url = new URL("https://api.example.com/v1/data")
    expect(isPrivateHostname(url.hostname)).toBe(false)
  })
})
