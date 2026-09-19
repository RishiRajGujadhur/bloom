# Private journal search

Open Daybook and choose **Enable private search** in **Find a thought**. The
first nonempty page or query downloads the quantized MiniLM model and runtime
assets. Model files use the browser cache when available. Journal text and query
text are processed in a Web Worker and are never included in network requests.
Enabling lasts for the mounted journal session; the search database and model
cache survive reloads, subject to browser storage eviction.

## Data flow

- The existing localStorage journal remains the source of truth.
- Enabling search backfills existing entries into `JournalDB.entries` (Dexie).
- Completing a page while search is enabled updates the index in the background.
- TipTap text nodes and legacy strings are extracted across all writing fields.
- Plain text is stored before inference; failed embeddings can be retried without
  losing the original journal. Changed text replaces its old vector.
- Long pages are chunked, embedded with mean pooling and normalization, then
  averaged and normalized into one 384-dimensional Float32Array per entry.
- Queries debounce for 350 ms, embed locally, and rank entries by cosine
  similarity. The five nearest pages are shown, even if similarity is low;
  scores are not confidence percentages. Clicking a result opens its writing mode.
- Requests have correlation IDs and timeouts; inference is serialized. Unmount
  terminates the worker and rejects pending requests. Superseded searches cannot
  update the displayed results.

This initial phase implements semantic retrieval only. FlexSearch hybrid ranking,
command-palette integration, and Hermes requests are not enabled. **Ask Local
Coach · Preview** only explains the proposed top-three context; it sends nothing.

## Dependencies and privacy

The requested `@xenova/transformers` 2.17.2 package pins older transitive
dependencies. Scoped overrides update `onnx-proto`'s protobufjs to 7.6.6 and
Transformers' Node-only sharp to 0.35.4 to resolve current audit findings.
Sharp is excluded by Transformers' browser mapping. Keep these overrides under
review when upgrading the inference library.

IndexedDB is local persistence, not encryption. Clearing site data removes the
search index and can remove model caches. The English MiniLM model is not a
multilingual retrieval model. Offline availability depends on which assets have
already been cached; first use requires a connection to the asset hosts.

## Verification

Run `npm test -- --runInBand`, `npm run build`, and `npm audit`.
The search tests mock the embedding worker and database. For an end-to-end check,
save a test page about exhaustion, enable search, wait for model preparation,
search for "feeling burnt out", and open the matching page. Edit the page, save,
and repeat to check reindexing. Test with the network disconnected after loading
the model to verify cached operation on the target browser.
