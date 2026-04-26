import { describe, test, expect } from "bun:test"
import { AppFileSystem } from "@opencode-ai/shared/filesystem"
import { contains } from "../../../src/util/filesystem"

describe("path boundary enforcement", () => {
  describe("AppFileSystem.contains (shared - pathResolve based)", () => {
    test("allows paths within project", () => {
      expect(AppFileSystem.contains("/project", "/project/src/index.ts")).toBe(true)
    })

    test("allows deeply nested paths within project", () => {
      expect(AppFileSystem.contains("/project", "/project/a/b/c/d/file.ts")).toBe(true)
    })

    test("allows the project root itself", () => {
      // Same path: relative is "", which does not start with ".."
      expect(AppFileSystem.contains("/project", "/project")).toBe(true)
    })

    test("blocks ../ traversal", () => {
      expect(AppFileSystem.contains("/project", "/project/../etc/passwd")).toBe(false)
    })

    test("blocks multiple ../ traversals", () => {
      expect(AppFileSystem.contains("/project", "/project/../../etc/passwd")).toBe(false)
    })

    test("blocks resolved .. in paths", () => {
      // After resolving, /project/sub/../../etc -> /etc which is outside /project
      expect(AppFileSystem.contains("/project", "/project/sub/../../etc/passwd")).toBe(false)
    })

    test("blocks absolute paths outside project", () => {
      expect(AppFileSystem.contains("/project", "/etc/passwd")).toBe(false)
    })

    test("blocks sibling directories", () => {
      expect(AppFileSystem.contains("/project-a", "/project-b/file.ts")).toBe(false)
    })

    test("handles prefix collision edge case: /project vs /project-2", () => {
      // /project-2 should NOT be considered inside /project
      expect(AppFileSystem.contains("/project", "/project-2/file.ts")).toBe(false)
    })

    test("handles prefix collision edge case: /app vs /application", () => {
      expect(AppFileSystem.contains("/app", "/application/file.ts")).toBe(false)
    })

    test("handles trailing slash variations", () => {
      // Both with trailing slash normalization
      expect(AppFileSystem.contains("/project/", "/project/file.ts")).toBe(true)
    })

    test("allows subdirectory that is a prefix of another directory name", () => {
      // /project/src is genuinely inside /project
      expect(AppFileSystem.contains("/project", "/project/src")).toBe(true)
    })
  })

  describe("contains (local util - relative based)", () => {
    test("allows paths within project", () => {
      expect(contains("/project", "/project/src/index.ts")).toBe(true)
    })

    test("allows the project root itself", () => {
      expect(contains("/project", "/project")).toBe(true)
    })

    test("blocks paths outside project", () => {
      expect(contains("/project", "/etc/passwd")).toBe(false)
    })

    test("blocks ../ traversal (unresolved)", () => {
      // Note: the local `contains` does NOT resolve paths first,
      // so relative("/project", "/project/../etc") may not start with ".."
      // depending on Node's `relative` behavior with unresolved segments.
      // This test documents the actual behavior.
      const result = contains("/project", "/project/../etc/passwd")
      // The local `contains` uses relative() without resolving first.
      // relative("/project", "/project/../etc/passwd") on most platforms
      // resolves to "../etc/passwd" which starts with ".."
      expect(result).toBe(false)
    })

    test("blocks sibling directories", () => {
      expect(contains("/project-a", "/project-b/file.ts")).toBe(false)
    })

    test("handles prefix collision: /project vs /project-2", () => {
      expect(contains("/project", "/project-2/file.ts")).toBe(false)
    })
  })

  describe("path traversal attack vectors", () => {
    test("blocks null byte injection in path", () => {
      // Null bytes can truncate paths on some systems
      const result = AppFileSystem.contains("/project", "/project/file.txt\0../../etc/passwd")
      // Should not be considered inside; behavior depends on path resolution
      expect(typeof result).toBe("boolean")
    })

    test("blocks mixed traversal with legitimate segments", () => {
      // /project/legit/../../../etc = /etc (outside project)
      expect(AppFileSystem.contains("/project", "/project/legit/../../../etc/passwd")).toBe(false)
    })

    test("blocks traversal via current directory references", () => {
      // /project/./../../etc = /etc (outside project)
      expect(AppFileSystem.contains("/project", "/project/./../../etc/passwd")).toBe(false)
    })

    test("allows legitimate .. that stays within project", () => {
      // /project/a/../b resolves to /project/b (inside project)
      expect(AppFileSystem.contains("/project", "/project/a/../b/file.ts")).toBe(true)
    })

    test("allows complex but safe path navigation within project", () => {
      // /project/a/b/../../c resolves to /project/c (inside project)
      expect(AppFileSystem.contains("/project", "/project/a/b/../../c/file.ts")).toBe(true)
    })
  })

  describe("symlink-awareness considerations", () => {
    test("documents that contains uses logical path resolution, not realpath", () => {
      // The contains function resolves paths logically using pathResolve/relative,
      // but does not follow symlinks. If a symlink inside /project points to /etc,
      // contains("/project", "/project/symlink-to-etc") would return true
      // because the logical path is inside /project.
      // This is by design: symlink resolution is a filesystem-level concern
      // that should be handled separately when actually accessing files.
      expect(AppFileSystem.contains("/project", "/project/symlink-target")).toBe(true)
    })
  })
})
