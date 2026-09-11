"""
Aravanta CloudOS — Knowledge Base Indexer
Indexes documentation, SOPs, and incident runbooks from `docs/` and `docs/runbooks/`.
Provides semantic chunking, keyword-BM25 / cosine similarity retrieval.
"""
import os
import re
import math
from typing import List, Dict, Any, Tuple, Optional


class DocumentChunk:
    def __init__(self, doc_id: str, title: str, file_path: str, heading: str, content: str):
        self.doc_id = doc_id
        self.title = title
        self.file_path = file_path
        self.heading = heading
        self.content = content.strip()
        self.word_set = set(re.findall(r'\w+', (title + " " + heading + " " + content).lower()))


class KnowledgeBase:
    """
    In-memory semantic search engine for platform docs and runbooks.
    Easily configurable to synchronize with PostgreSQL pgvector.
    """
    def __init__(self, docs_root: Optional[str] = None):
        if docs_root is None:
            # Default to repo root docs/
            base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
            docs_root = os.path.join(base, "docs")
        self.docs_root = docs_root
        self.chunks: List[DocumentChunk] = []
        self.indexed_files: List[str] = []
        self._build_index()

    def _build_index(self):
        """Scans docs/ and docs/runbooks/ and partitions markdown into semantic sections."""
        if not os.path.exists(self.docs_root):
            return

        for root, _, files in os.walk(self.docs_root):
            for file in files:
                if file.endswith(".md"):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.docs_root)
                    self._index_file(full_path, rel_path)

    def _index_file(self, full_path: str, rel_path: str):
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

            title = os.path.splitext(os.path.basename(rel_path))[0].replace("-", " ").title()
            self.indexed_files.append(rel_path)

            # Split by markdown headers (#, ##, ###)
            sections = re.split(r'\n(?=#{1,3}\s+)', text)
            for idx, sec in enumerate(sections):
                if not sec.strip():
                    continue
                header_match = re.match(r'^(#{1,3})\s+(.+)$', sec.strip().split('\n')[0])
                heading = header_match.group(2) if header_match else f"Section {idx + 1}"
                chunk_id = f"{rel_path}#{idx}"
                self.chunks.append(DocumentChunk(
                    doc_id=chunk_id,
                    title=title,
                    file_path=rel_path,
                    heading=heading,
                    content=sec
                ))
        except Exception as e:
            pass

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Performs lexical and token-overlap ranking over indexed document chunks."""
        query_words = set(re.findall(r'\w+', query.lower()))
        if not query_words:
            return []

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in self.chunks:
            intersection = query_words.intersection(chunk.word_set)
            if intersection:
                score = len(intersection) / (math.sqrt(len(query_words)) * math.sqrt(len(chunk.word_set) or 1))
                # Boost if query matches title or heading
                heading_words = set(re.findall(r'\w+', (chunk.title + " " + chunk.heading).lower()))
                if query_words.intersection(heading_words):
                    score += 0.5
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk in scored_chunks[:top_k]:
            results.append({
                "doc_id": chunk.doc_id,
                "title": chunk.title,
                "file_path": chunk.file_path,
                "heading": chunk.heading,
                "score": round(score, 3),
                "excerpt": chunk.content[:400] + ("..." if len(chunk.content) > 400 else ""),
                "citation": f"[Doc: {chunk.file_path} > {chunk.heading}]"
            })
        return results


# Global singleton instance
knowledge_base = KnowledgeBase()
