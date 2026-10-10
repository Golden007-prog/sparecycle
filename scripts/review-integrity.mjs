// Shared canonical hash inputs for the API and pinned verifier. PostgreSQL JSONB
// preserves values but may reorder every object's keys; never hash a stored object directly.
export function snapshotPreimage(snapshot) {
  const repo = snapshot.repository;
  return JSON.stringify({
    repository: {
      installationId: repo.installationId,
      repositoryId: repo.repositoryId,
      owner: repo.owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      isPrivate: typeof repo.isPrivate === 'boolean' ? repo.isPrivate : null,
    },
    baseSha: snapshot.baseSha,
    treeSha: snapshot.treeSha,
    targetPath: snapshot.targetPath,
    files: [...snapshot.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0).map(file => ({ path: file.path, sha256: file.sha256, blobSha: file.blobSha })),
  });
}

export function candidatePreimage(candidate) {
  return JSON.stringify({
    path: candidate.path,
    content: candidate.content,
    baseSha: candidate.baseSha,
    snapshotHash: candidate.snapshotHash,
    evidenceHash: candidate.evidenceHash,
  });
}
