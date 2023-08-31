const semVerPattern =
  /^(0|[1-9]\d*|\d+)\.(0|[1-9]\d*|\d+)\.(0|[1-9]\d*|\d+)(?:-([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/i;

export function parseSemver(versionString) {
  const [semVer, major, minor, patch, prerelease, buildmetadata] = versionString.match(semVerPattern) ?? [];
  return { semVer, major: parseInt(major), minor: parseInt(minor), patch: parseInt(patch), prerelease, buildmetadata };
}

export function compareSemVers(semver1, semver2) {
  const ver1 = parseSemver(semver1);
  const ver2 = parseSemver(semver2);

  if (!ver1.semVer || !ver2.semVer) {
    throw new Error('invalid semver format');
  }

  if (ver1.major !== ver2.major) {
    return ver1.major - ver2.major;
  }

  if (ver1.minor !== ver2.minor) {
    return ver1.minor - ver2.minor;
  }

  return ver1.patch - ver2.patch;
}
