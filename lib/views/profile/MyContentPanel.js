// lib/views/profile/MyContentPanel.js
//
// Profile > My Content panel: user's file/audio/PDF/URL library with
// upload + URL-add + search + per-item linking to habits/to-dos/goals.
//
// Wave 4.4.7. Originally inline at index.html L15450-L16146 inside the
// showProfile IIFE. Backed by data.userContent (array of items with
// id, title, url, mime, etc.). Audio renders with the BgAudio
// component (lock-screen controls); other types open in the default
// app.
//
// VERBATIM body extraction with helpers-bag pattern. Helpers bag is
// big (~20 entries) because My Content has its own draft state, sort
// state, filter state, expansion state, search state, upload state,
// plus the link-picker state — all of which still live in App.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function MyContentPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    // Data + identity + helpers
    const data = h.data || {};
    const save = h.save || (() => {});
    const authUser = h.authUser;
    const sectionTitle = h.sectionTitle;
    const inputS = h.inputS;
    const labelS = h.labelS;
    const canUploadFiles = h.canUploadFiles || (() => false);
    const FILE_UPLOAD_ALLOWLIST = h.FILE_UPLOAD_ALLOWLIST || (typeof window !== "undefined" && window.FILE_UPLOAD_ALLOWLIST) || new Set();
    const BgAudio = h.BgAudio || (typeof window !== "undefined" && window.BgAudio);
    // Draft state for the URL-add row
    const ucDraftTitle = h.ucDraftTitle || "";
    const sUcDraftTitle = h.sUcDraftTitle || (() => {});
    const ucDraftUrl = h.ucDraftUrl || "";
    const sUcDraftUrl = h.sUcDraftUrl || (() => {});
    // Upload progress / migration banners
    const ucUploadProgress = h.ucUploadProgress || {};
    const setUcUploadProgress = h.setUcUploadProgress || (() => {});
    const ucMigrating = h.ucMigrating;
    // List view state
    const myContentSort = h.myContentSort || "newest";
    const updateMyContentSort = h.updateMyContentSort || (() => {});
    const myContentTypeFilter = h.myContentTypeFilter || "all";
    const updateMyContentTypeFilter = h.updateMyContentTypeFilter || (() => {});
    const myContentExpanded = h.myContentExpanded || {};
    const setMyContentExpanded = h.setMyContentExpanded || (() => {});
    const myContentSearch = h.myContentSearch || "";
    const setMyContentSearch = h.setMyContentSearch || (() => {});
    // Link picker
    const linkPickerKind = h.linkPickerKind;
    const setLinkPickerKind = h.setLinkPickerKind || (() => {});

    const myContentPanel = /*#__PURE__*/React.createElement("div", null,
      sectionTitle("My Content"),
      /*#__PURE__*/React.createElement("div", {
        style: { fontSize: 12, color: "#9ca3af", marginBottom: 14, lineHeight: 1.45 }
      }, canUploadFiles(authUser && authUser.email)
          ? "Upload audio, video, PDFs, or paste a URL — link each item to the habits, to-dos, or goals it belongs to. Audio + image previews play right here; everything else opens in your default app."
          : "Paste a URL to any audio, video, PDF, or page — then link it to the habits, to-dos, or goals it supports. (File uploads are owner-only right now.)"),
      // One-time migration banner — promotes legacy base64 entries to
      // Firebase Storage so they cross-device sync. Hidden when nothing
      // is migrating.
      ucMigrating && /*#__PURE__*/React.createElement("div", {
        role: "status",
        "aria-live": "polite",
        style: { background: "var(--c-tint-info-bg)", border: "1px solid var(--c-tint-info-border)", color: "var(--c-tint-info-fg)", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10 }
      }, "Syncing files to cloud storage… " + ucMigrating.done + " / " + ucMigrating.total),
      // Add via URL row
      /*#__PURE__*/React.createElement("div", {
        style: { background: "var(--c-surface-raised)", borderRadius: 10, padding: "12px", marginBottom: 10 }
      },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Add a link"),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 6 } },
          /*#__PURE__*/React.createElement("input", {
            type: "text",
            value: ucDraftTitle,
            onChange: e => sUcDraftTitle(e.target.value.slice(0, 60)),
            placeholder: "Title",
            style: { ...inputS, flex: 1 }
          }),
          /*#__PURE__*/React.createElement("input", {
            type: "url",
            value: ucDraftUrl,
            onChange: e => sUcDraftUrl(e.target.value.slice(0, 500)),
            placeholder: "https://…",
            style: { ...inputS, flex: 2 }
          }),
          /*#__PURE__*/React.createElement("button", {
            type: "button",
            disabled: !ucDraftTitle.trim() || !ucDraftUrl.trim(),
            onClick: () => {
              const title = ucDraftTitle.trim();
              const url = ucDraftUrl.trim();
              if (!title || !url) return;
              // Block javascript:, data:, vbscript:, file:, and any
              // other non-web scheme. The link is rendered as <a href>
              // and clicking a javascript: URL would execute in our
              // origin (XSS with full Firebase token access). Cross-
              // device sync means a crafted URL on one device attacks
              // every device. Allowlist http/https only.
              if (!/^https?:\/\//i.test(url)) {
                alert("Only http:// and https:// URLs are allowed.");
                return;
              }
              save({
                ...data,
                userContent: [...(data.userContent || []), {
                  id: Date.now(),
                  kind: "link",
                  title,
                  url,
                  linkedHabitIds: [],
                  linkedTodoIds: [],
                  linkedGoalIds: [],
                  createdAt: Date.now()
                }]
              });
              sUcDraftTitle("");
              sUcDraftUrl("");
            },
            style: {
              background: (ucDraftTitle.trim() && ucDraftUrl.trim()) ? "#2d5a2d" : "#9ca3af",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "0 14px", fontSize: 12, fontWeight: 700,
              cursor: (ucDraftTitle.trim() && ucDraftUrl.trim()) ? "pointer" : "default"
            }
          }, "Save")
        )
      ),
      // Add via file upload — gated on the FILE_UPLOAD_ALLOWLIST so
      // non-owner accounts can't burn the bucket. They still get the
      // "Add a link" row above, which covers YouTube / Drive / Dropbox /
      // any hosted PDF without any storage cost on our side.
      canUploadFiles(authUser && authUser.email) && /*#__PURE__*/React.createElement("div", {
        style: { background: "var(--c-surface-raised)", borderRadius: 10, padding: "12px", marginBottom: 16 }
      },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Upload a file"),
        /*#__PURE__*/React.createElement("input", {
          type: "file",
          accept: "audio/*,video/*,application/pdf,image/*",
          disabled: !!ucUploadProgress,
          onChange: (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            // 10 MB cap — matches storage.rules. Defense in depth: rules
            // reject larger writes too, but checking here gives an
            // immediate, friendly error instead of a Firebase exception
            // halfway through a long upload.
            const MAX = 10 * 1024 * 1024;
            if (file.size > MAX) {
              alert("File is " + Math.round(file.size / 1024 / 1024) + " MB — that's larger than the 10 MB limit. Pick a smaller file or paste a URL instead.");
              e.target.value = "";
              return;
            }
            // Sign-in required: Storage rules reject anonymous writes,
            // and we need an owner uid to namespace the path.
            const uid = (auth && auth.currentUser && auth.currentUser.uid) || null;
            if (!uid) {
              alert("Sign in to upload files. (Demo mode keeps everything in memory.)");
              e.target.value = "";
              return;
            }
            const id = Date.now();
            // Sanitize filename for the Storage key — strip path-like
            // characters and limit length. The original file.name still
            // lives on the userContent entry for display/download.
            const safeName = String(file.name || "file")
              .replace(/[^A-Za-z0-9._-]+/g, "_")
              .slice(0, 80);
            const path = "users/" + uid + "/content/" + id + "-" + safeName;
            setUcUploadProgress({ name: file.name, percent: 0 });
            const ref = storage.ref(path);
            const task = ref.put(file, { contentType: file.type || "application/octet-stream" });
            task.on("state_changed",
              (snap) => {
                if (!snap.totalBytes) return;
                setUcUploadProgress({ name: file.name, percent: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) });
              },
              (err) => {
                try { console.warn("[verrocchio mycontent upload] failed:", err && err.code, err && err.message); } catch (_) {}
                setUcUploadProgress(null);
                alert("Upload failed: " + (err && err.message ? err.message : "unknown error"));
                e.target.value = "";
              },
              async () => {
                try {
                  const downloadURL = await task.snapshot.ref.getDownloadURL();
                  // Use latestData.current so a concurrent save (e.g. a
                  // habit toggle on another tab) isn't clobbered by the
                  // closure-captured `data`.
                  const cur = latestData.current || data;
                  save({
                    ...cur,
                    userContent: [...(cur.userContent || []), {
                      id,
                      kind: "file",
                      title: file.name.replace(/\.[^.]+$/, ""),
                      fileName: file.name,
                      fileType: file.type || "application/octet-stream",
                      fileSize: file.size,
                      // Storage-backed: cross-device. Renderers prefer
                      // downloadURL when present; fileData is only kept
                      // for legacy entries that pre-date Storage.
                      storagePath: path,
                      downloadURL,
                      linkedHabitIds: [],
                      linkedTodoIds: [],
                      linkedGoalIds: [],
                      createdAt: Date.now()
                    }]
                  });
                } catch (err2) {
                  try { console.warn("[verrocchio mycontent upload] downloadURL failed:", err2); } catch (_) {}
                  alert("Upload finished but the file URL couldn't be retrieved. Try refreshing.");
                } finally {
                  setUcUploadProgress(null);
                  e.target.value = "";
                }
              }
            );
          },
          style: { fontSize: 12, color: "var(--c-text-soft)" }
        }),
        ucUploadProgress && /*#__PURE__*/React.createElement("div", {
          style: { marginTop: 8 }
        },
          /*#__PURE__*/React.createElement("div", {
            style: { height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }
          },
            /*#__PURE__*/React.createElement("div", {
              style: { height: "100%", width: ucUploadProgress.percent + "%", background: "#2d5a2d", transition: "width 120ms linear" }
            })
          ),
          /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 10, color: "#6b7280", marginTop: 4 }
          }, "Uploading " + ucUploadProgress.name + "… " + ucUploadProgress.percent + "%")
        ),
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 10, color: "#9ca3af", marginTop: 6, lineHeight: 1.5 }
        }, "Up to 100 MB per file. Files sync across all your devices — sign in on a laptop or tablet to upload there too.")
      ),
      // ── Spotify-like library ──
      // Empty state if there's literally nothing yet, otherwise a search
      // + type-chip toolbar + grid of thumbnail cards. Selecting a card
      // reveals a full edit/preview panel ABOVE the grid (so the grid
      // layout stays uniform and the user sees both selection context
      // and library at once).
      ((data.userContent || []).length === 0)
        ? /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "32px 0" }
          }, "Nothing saved yet — add a link or a file above.")
        : (() => {
          // Classify each item for the type-chip filter.
          const kindOf = it => {
            if (!it) return "other";
            if (it.kind === "link") return "link";
            const ft = (it.fileType || "");
            if (ft.startsWith("audio/")) return "audio";
            if (ft.startsWith("image/")) return "image";
            if (ft.startsWith("video/")) return "video";
            if (ft === "application/pdf" || /\.pdf$/i.test(it.fileName || "")) return "pdf";
            return "file";
          };
          const titleOf = it => (it.title || it.fileName || "").toLowerCase();
          const all = (data.userContent || []).slice();
          // Apply type filter first, then text search.
          const typeFiltered = myContentTypeFilter === "all"
            ? all
            : all.filter(c => kindOf(c) === myContentTypeFilter);
          const q = (myContentSearch || "").trim().toLowerCase();
          const searched = q
            ? typeFiltered.filter(c =>
                titleOf(c).includes(q) ||
                (c.url || "").toLowerCase().includes(q) ||
                (c.fileName || "").toLowerCase().includes(q))
            : typeFiltered;
          // Sort. Same modes as before, applied AFTER filter+search so
          // counts on the type chips reflect the unfiltered library.
          const kindRank = it => {
            const k = kindOf(it);
            if (k === "link")  return "1-link";
            if (k === "audio") return "2-audio";
            if (k === "image") return "3-image";
            if (k === "video") return "4-video";
            if (k === "pdf")   return "5-pdf";
            return "6-file";
          };
          const groupByEntity = (entityKey, dataKey) => {
            const items = (data[dataKey] || []);
            const nameById = new Map(items.map(x => [String(x.id), (x.text || x.title || "").toLowerCase()]));
            const grouped = [];
            const seen = new Set();
            const sortedEntityIds = items
              .slice()
              .sort((a, b) => (nameById.get(String(a.id)) || "").localeCompare(nameById.get(String(b.id)) || ""))
              .map(x => String(x.id));
            for (const eid of sortedEntityIds) {
              const matches = searched
                .filter(c => (c[entityKey] || []).some(x => String(x) === eid) && !seen.has(c.id))
                .sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
              for (const m of matches) { grouped.push(m); seen.add(m.id); }
            }
            const unlinked = searched
              .filter(c => !(c[entityKey] || []).length && !seen.has(c.id))
              .sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
            return grouped.concat(unlinked);
          };
          let sorted;
          if (myContentSort === "title") {
            sorted = searched.slice().sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
          } else if (myContentSort === "type") {
            sorted = searched.slice().sort((a, b) => {
              const r = kindRank(a).localeCompare(kindRank(b));
              return r !== 0 ? r : titleOf(a).localeCompare(titleOf(b));
            });
          } else if (myContentSort === "goal") {
            sorted = groupByEntity("linkedGoalIds", "goals");
          } else if (myContentSort === "habit") {
            sorted = groupByEntity("linkedHabitIds", "habits");
          } else {
            sorted = searched.slice().sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
          }
          // Type-chip definitions. Counts come from the UNFILTERED list
          // so the user can always see "there are 3 audios" even when
          // the current chip is "Image".
          const allKinds = all.map(kindOf);
          const countOf = k => allKinds.filter(x => x === k).length;
          const typeChips = [
            { val: "all",   label: "All",   count: all.length },
            { val: "audio", label: "Audio", count: countOf("audio") },
            { val: "image", label: "Image", count: countOf("image") },
            { val: "video", label: "Video", count: countOf("video") },
            { val: "pdf",   label: "PDF",   count: countOf("pdf") },
            { val: "file",  label: "File",  count: countOf("file") },
            { val: "link",  label: "Link",  count: countOf("link") }
          ].filter(c => c.val === "all" || c.count > 0);
          // Thumbnail builder. Each kind gets a distinct visual so the
          // grid scans like a library — image/video show actual content,
          // audio/pdf/link/file get tinted icon tiles in their semantic
          // color so a glance tells you what's there.
          const thumbStyle = (extra) => Object.assign({
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 10,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--c-surface-muted)"
          }, extra || {});
          const iconBadge = (emoji) => /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 36, opacity: 0.92, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.15))" }
          }, emoji);
          const cardThumbnail = (item) => {
            const kind = kindOf(item);
            const src = item.downloadURL || item.fileData || "";
            if (kind === "image" && src) {
              return /*#__PURE__*/React.createElement("div", {
                style: thumbStyle({ backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center" })
              });
            }
            if (kind === "video" && src) {
              // <video> autoplay+muted on first frame gives a "moving
              // poster" feel; if autoplay is blocked it stays on frame 0
              // which still looks like a thumbnail.
              return /*#__PURE__*/React.createElement("div", { style: thumbStyle({ background: "#000" }) },
                /*#__PURE__*/React.createElement("video", {
                  src, muted: true, playsInline: true, preload: "metadata",
                  style: { width: "100%", height: "100%", objectFit: "cover" }
                }),
                /*#__PURE__*/React.createElement("div", {
                  style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.18)" }
                }, /*#__PURE__*/React.createElement("div", {
                  style: { width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#111", paddingLeft: 3 }
                }, "▶"))
              );
            }
            if (kind === "audio") {
              // Simulated waveform — five tinted bars in a soft-purple
              // gradient. Pure CSS, zero asset cost.
              return /*#__PURE__*/React.createElement("div", {
                style: thumbStyle({ background: "linear-gradient(135deg,#7c3aed,#db2777)" })
              },
                /*#__PURE__*/React.createElement("div", {
                  style: { display: "flex", alignItems: "center", gap: 4, height: "44%" }
                },
                  [38, 72, 56, 88, 50].map((h, i) => /*#__PURE__*/React.createElement("div", {
                    key: i,
                    style: { width: 5, height: h + "%", background: "rgba(255,255,255,.92)", borderRadius: 3 }
                  }))
                ),
                /*#__PURE__*/React.createElement("div", {
                  style: { position: "absolute", bottom: 8, right: 10, fontSize: 16, color: "rgba(255,255,255,.92)" }
                }, "♪")
              );
            }
            if (kind === "pdf") {
              return /*#__PURE__*/React.createElement("div", {
                style: thumbStyle({ background: "linear-gradient(160deg,#fee2e2,#fca5a5)" })
              }, iconBadge("📄"));
            }
            if (kind === "link") {
              return /*#__PURE__*/React.createElement("div", {
                style: thumbStyle({ background: "linear-gradient(160deg,#cffafe,#06b6d4)" })
              }, iconBadge("🔗"));
            }
            return /*#__PURE__*/React.createElement("div", {
              style: thumbStyle({ background: "linear-gradient(160deg,#e5e7eb,#9ca3af)" })
            }, iconBadge("📎"));
          };
          // Render the full edit/preview panel for the currently-selected
          // item. Reused identically by the inline detail panel above
          // the grid. Returns null if nothing is selected.
          // Pull the detail-panel out of the IIFE so we don't pay the
          // closure + array-find cost on every render when nothing is
          // selected (this fires on every search keystroke / chip
          // toggle otherwise).
          const detailPanel = myContentExpanded == null ? null : (() => {
            const item = (data.userContent || []).find(c => String(c.id) === String(myContentExpanded));
            if (!item) return null;
            const kind = kindOf(item);
            const src = item.downloadURL || item.fileData;
            const linkedHabitNames = (item.linkedHabitIds || []).map(id => (data.habits || []).find(h => String(h.id) === String(id))).filter(Boolean);
            const linkedTodoNames = (item.linkedTodoIds || []).map(id => (data.todos || []).find(t => String(t.id) === String(id))).filter(Boolean);
            const linkedGoalNames = (item.linkedGoalIds || []).map(id => (data.goals || []).find(g => String(g.id) === String(id))).filter(Boolean);
            // Read the freshest data snapshot on every mutation so a
            // concurrent save (habit toggle, sync echo) doesn't get
            // clobbered by spreading a stale closure-captured `data`.
            // Same pattern togHabit / upload completion use.
            const updateItem = (patch) => {
              const cur = latestData.current || data;
              save({
                ...cur,
                userContent: (cur.userContent || []).map(c => String(c.id) === String(item.id) ? { ...c, ...patch } : c)
              });
            };
            const toggleLink = (k, id) => {
              const key = k === "habit" ? "linkedHabitIds" : k === "todo" ? "linkedTodoIds" : "linkedGoalIds";
              const cur = item[key] || [];
              const has = cur.some(x => String(x) === String(id));
              // Normalize ids to strings on insert so the array doesn't
              // accumulate heterogeneous types from select / chip paths.
              updateItem({ [key]: has ? cur.filter(x => String(x) !== String(id)) : [...cur, String(id)] });
            };
            const removeItem = () => {
              if (!confirm("Remove '" + (item.title || item.fileName || "this item") + "' from My Content?")) return;
              if (item.storagePath) {
                try { storage.ref(item.storagePath).delete().catch(err => { try { console.warn("[verrocchio mycontent delete] storage delete failed:", err && err.code); } catch (_) {} }); } catch (_) {}
              }
              const cur = latestData.current || data;
              save({ ...cur, userContent: (cur.userContent || []).filter(c => String(c.id) !== String(item.id)) });
              setMyContentExpanded(null);
            };
            return /*#__PURE__*/React.createElement("div", {
              style: { background: "var(--c-surface)", border: "1px solid var(--c-tint-brand-fg)", borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: "0 4px 16px rgba(45,90,45,.12)" }
            },
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }
              },
                /*#__PURE__*/React.createElement("span", {
                  style: { fontSize: 9, fontWeight: 700, color: "var(--c-tint-brand-fg)", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", letterSpacing: 0.4 }
                }, kind),
                /*#__PURE__*/React.createElement("input", {
                  type: "text",
                  "aria-label": "Display name (used everywhere this file is linked)",
                  value: item.title || "",
                  placeholder: "Display name…",
                  onChange: e => updateItem({ title: e.target.value.slice(0, 80) }),
                  style: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 700, color: "var(--c-text)" }
                }),
                /*#__PURE__*/React.createElement("button", {
                  "aria-label": "Remove",
                  onClick: removeItem,
                  title: "Remove",
                  style: { background: "var(--c-surface-muted)", border: "none", borderRadius: 6, padding: "4px 10px", color: "var(--c-tint-danger-fg)", fontSize: 12, fontWeight: 700, cursor: "pointer" }
                }, "Delete"),
                /*#__PURE__*/React.createElement("button", {
                  "aria-label": "Close",
                  onClick: () => setMyContentExpanded(null),
                  title: "Close",
                  style: { background: "var(--c-surface-muted)", border: "none", borderRadius: 6, padding: "4px 10px", color: "var(--c-text-faint)", fontSize: 12, fontWeight: 700, cursor: "pointer" }
                }, "Close")
              ),
              // Display-name hint — explicit so users know editing this
              // changes how the file appears wherever it's linked.
              /*#__PURE__*/React.createElement("div", {
                style: { fontSize: 10, color: "var(--c-text-faint)", marginBottom: 10, lineHeight: 1.5 }
              }, "This is the display name shown wherever the file is linked. Originally: " + (item.fileName || (item.kind === "link" ? "(link)" : "(file)"))),
              // Preview block
              kind === "audio" && src && /*#__PURE__*/React.createElement("div", {
                style: { marginBottom: 10 }
              }, /*#__PURE__*/React.createElement(BgAudio, {
                src, title: item.title || item.fileName || "Audio", artist: "Verrocchio"
              })),
              kind === "image" && src && /*#__PURE__*/React.createElement("img", {
                src, alt: item.title || "",
                style: { maxWidth: "100%", maxHeight: 280, borderRadius: 8, marginBottom: 10, display: "block" }
              }),
              kind === "video" && src && /*#__PURE__*/React.createElement("video", {
                controls: true, src, playsInline: true, preload: "metadata",
                style: { width: "100%", maxHeight: 320, borderRadius: 8, marginBottom: 10 }
              }),
              kind === "link" && /*#__PURE__*/React.createElement("a", {
                href: item.url, target: "_blank", rel: "noopener noreferrer",
                style: { display: "block", fontSize: 12, color: "#0891b2", marginBottom: 10, wordBreak: "break-all", textDecoration: "underline" }
              }, item.url),
              (kind === "pdf" || kind === "file") && src && /*#__PURE__*/React.createElement("a", {
                href: src, download: item.fileName,
                target: "_blank", rel: "noopener noreferrer",
                style: { display: "inline-block", fontSize: 13, color: "#2d5a2d", fontWeight: 700, marginBottom: 10, textDecoration: "underline" }
              }, "⬇ Open " + (item.fileName || "file") + (item.fileSize ? " (" + Math.round(item.fileSize / 1024) + " KB)" : "")),
              // Linked-to picker
              /*#__PURE__*/React.createElement("div", {
                style: { borderTop: "1px dashed #e5e7eb", paddingTop: 10, marginTop: 4 }
              },
                /*#__PURE__*/React.createElement("div", {
                  style: { fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }
                }, "Linked to"),
                (linkedHabitNames.length === 0 && linkedTodoNames.length === 0 && linkedGoalNames.length === 0)
                  ? /*#__PURE__*/React.createElement("div", {
                      style: { fontSize: 11, color: "#9ca3af", marginBottom: 8 }
                    }, "Nothing yet — pick from below.")
                  : /*#__PURE__*/React.createElement("div", {
                      style: { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }
                    },
                      linkedHabitNames.map(h => /*#__PURE__*/React.createElement("span", {
                        key: "lh-" + h.id,
                        onClick: () => toggleLink("habit", h.id),
                        style: { fontSize: 10, fontWeight: 600, color: "#2d5a2d", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 12, padding: "2px 8px", cursor: "pointer" }
                      }, "🌿 " + h.text + " ×")),
                      linkedTodoNames.map(t => /*#__PURE__*/React.createElement("span", {
                        key: "lt-" + t.id,
                        onClick: () => toggleLink("todo", t.id),
                        style: { fontSize: 10, fontWeight: 600, color: "var(--c-tint-warn-fg)", background: "var(--c-tint-warn-bg)", border: "1px solid var(--c-tint-warn-border)", borderRadius: 12, padding: "2px 8px", cursor: "pointer" }
                      }, "✓ " + t.text + " ×")),
                      linkedGoalNames.map(g => /*#__PURE__*/React.createElement("span", {
                        key: "lg-" + g.id,
                        onClick: () => toggleLink("goal", g.id),
                        style: { fontSize: 10, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "2px 8px", cursor: "pointer" }
                      }, "🎯 " + g.text + " ×"))
                    ),
                // Single "Link to" entry → sub-menu with four targets.
                // "General" tags the file as a non-specific resource
                // (no entity link) so it still surfaces in My Content
                // but isn't pinned to any habit/goal/todo.
                (() => {
                  const segBtn = (val, label) => {
                    const active = linkPickerKind === val;
                    return /*#__PURE__*/React.createElement("button", {
                      key: val,
                      type: "button",
                      onClick: () => setLinkPickerKind(active ? null : val),
                      style: {
                        flex: 1, minHeight: 36,
                        padding: "8px 10px", borderRadius: 8,
                        border: "1px solid " + (active ? "var(--c-tint-brand-fg)" : "var(--c-border)"),
                        background: active ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)",
                        color: active ? "var(--c-tint-brand-fg)" : "var(--c-text-soft)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        WebkitTapHighlightColor: "transparent"
                      }
                    }, label);
                  };
                  const isGeneral = !!item.isGeneral;
                  const pickerSelect = (kind, list, key) => /*#__PURE__*/React.createElement("select", {
                    "aria-label": "Link a " + kind,
                    value: "",
                    onChange: e => {
                      const v = e.target.value;
                      if (!v) return;
                      toggleLink(kind, Number(v) || v);
                    },
                    style: { ...inputS, width: "100%", marginTop: 8, minHeight: 40, fontSize: 13, padding: "8px 10px" }
                  },
                    /*#__PURE__*/React.createElement("option", { value: "" }, "Pick a " + kind + " to link…"),
                    list.filter(x => !(item[key] || []).some(id => String(id) === String(x.id)))
                      .map(x => /*#__PURE__*/React.createElement("option", { key: x.id, value: x.id }, ((x.text || x.title || "") + "").slice(0, 48)))
                  );
                  return /*#__PURE__*/React.createElement("div", null,
                    /*#__PURE__*/React.createElement("button", {
                      type: "button",
                      onClick: () => setLinkPickerKind(linkPickerKind ? null : "habit"),
                      style: {
                        width: "100%", minHeight: 40,
                        padding: "10px 12px", borderRadius: 10,
                        border: "1px solid var(--c-border)",
                        background: "var(--c-surface-raised)",
                        color: "var(--c-text)", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between"
                      }
                    }, "Link to…", /*#__PURE__*/React.createElement("span", { "aria-hidden": true, style: { fontSize: 12, color: "var(--c-text-faint)" } }, linkPickerKind ? "▴" : "▾")),
                    linkPickerKind && /*#__PURE__*/React.createElement("div", {
                      style: { marginTop: 8, padding: 10, background: "var(--c-surface-muted)", borderRadius: 10 }
                    },
                      /*#__PURE__*/React.createElement("div", {
                        style: { display: "flex", gap: 6, marginBottom: 8 }
                      },
                        segBtn("habit",   "Habits"),
                        segBtn("goal",    "Goals"),
                        segBtn("todo",    "To-dos"),
                        segBtn("general", "General")
                      ),
                      linkPickerKind === "habit"   && pickerSelect("habit", data.habits || [], "linkedHabitIds"),
                      linkPickerKind === "goal"    && pickerSelect("goal",  data.goals  || [], "linkedGoalIds"),
                      linkPickerKind === "todo"    && pickerSelect("todo",  data.todos  || [], "linkedTodoIds"),
                      linkPickerKind === "general" && /*#__PURE__*/React.createElement("div", {
                        style: { padding: "10px 4px" }
                      },
                        /*#__PURE__*/React.createElement("label", {
                          style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-text-soft)", cursor: "pointer" }
                        },
                          /*#__PURE__*/React.createElement("input", {
                            type: "checkbox",
                            checked: isGeneral,
                            onChange: e => updateItem({ isGeneral: !!e.target.checked }),
                            style: { width: 18, height: 18, cursor: "pointer" }
                          }),
                          "Mark as general (not specific to a habit, goal, or to-do)"
                        ),
                        /*#__PURE__*/React.createElement("div", {
                          style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: 6, lineHeight: 1.5 }
                        }, "General items stay in My Content but won't surface inside any specific habit/goal/to-do panel.")
                      )
                    )
                  );
                })()
              )
            );
          })();
          return /*#__PURE__*/React.createElement(React.Fragment, null,
            // Toolbar — search left, sort right.
            /*#__PURE__*/React.createElement("div", {
              style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }
            },
              /*#__PURE__*/React.createElement("input", {
                type: "search",
                "aria-label": "Search My Content",
                value: myContentSearch,
                onChange: e => setMyContentSearch(e.target.value),
                placeholder: "Search title, file, or URL…",
                style: { flex: 1, fontSize: 13, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", outline: "none" }
              }),
              /*#__PURE__*/React.createElement("select", {
                "aria-label": "Sort My Content",
                value: myContentSort,
                onChange: e => updateMyContentSort(e.target.value),
                style: { fontSize: 12, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", cursor: "pointer" }
              },
                /*#__PURE__*/React.createElement("option", { value: "recent" }, "Recent"),
                /*#__PURE__*/React.createElement("option", { value: "title" }, "A–Z"),
                /*#__PURE__*/React.createElement("option", { value: "type" }, "Type"),
                /*#__PURE__*/React.createElement("option", { value: "goal" }, "Goal"),
                /*#__PURE__*/React.createElement("option", { value: "habit" }, "Habit")
              )
            ),
            // Type-filter chips. Horizontal scroll on narrow screens.
            /*#__PURE__*/React.createElement("div", {
              style: { display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "thin" }
            }, typeChips.map(c => {
              const active = myContentTypeFilter === c.val;
              return /*#__PURE__*/React.createElement("button", {
                key: c.val,
                type: "button",
                onClick: () => updateMyContentTypeFilter(c.val),
                style: {
                  flexShrink: 0,
                  fontSize: 12, fontWeight: 600,
                  padding: "6px 14px", borderRadius: 999,
                  border: "1px solid " + (active ? "#2d5a2d" : "var(--c-border)"),
                  background: active ? "#2d5a2d" : "var(--c-surface-raised)",
                  color: active ? "#fff" : "var(--c-text-soft)",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent"
                }
              }, c.label, /*#__PURE__*/React.createElement("span", {
                style: { marginLeft: 6, opacity: 0.7, fontWeight: 500 }
              }, c.count));
            })),
            // Selected-item detail panel (above the grid so the user
            // sees both the selection and the rest of the library).
            detailPanel,
            // Empty filter state.
            sorted.length === 0 && /*#__PURE__*/React.createElement("div", {
              style: { fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "24px 0" }
            }, q ? "No matches for “" + q + "”." : "Nothing in this filter — try All."),
            // Card grid. Tight density so 50+ items fit a couple of
            // screens, not 50. minmax(96px, 1fr) gives ~4 cols on a
            // 360px-wide phone and 7-8 cols on a tablet — plenty for a
            // library you scan, not scroll endlessly.
            /*#__PURE__*/React.createElement("div", {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
                gap: 8
              }
            }, sorted.map(item => {
              const kind = kindOf(item);
              const linkedCount =
                (item.linkedHabitIds || []).length +
                (item.linkedTodoIds || []).length +
                (item.linkedGoalIds || []).length;
              const subtitle = item.kind === "link"
                ? (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch (e) { return item.url || ""; } })()
                : kind.toUpperCase() + (item.fileSize ? " · " + (item.fileSize >= 1024 * 1024
                    ? (item.fileSize / 1024 / 1024).toFixed(1) + " MB"
                    : Math.round(item.fileSize / 1024) + " KB") : "");
              const isSelected = myContentExpanded === item.id;
              return /*#__PURE__*/React.createElement("button", {
                key: item.id,
                type: "button",
                onClick: () => setMyContentExpanded(isSelected ? null : item.id),
                "aria-pressed": isSelected,
                "aria-label": (item.title || item.fileName || "Untitled") + " — " + kind,
                title: item.title || item.fileName || "Untitled",
                style: {
                  display: "flex", flexDirection: "column", gap: 4,
                  padding: 6,
                  background: isSelected ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)",
                  border: "1px solid " + (isSelected ? "#2d5a2d" : "var(--c-border)"),
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  boxShadow: isSelected ? "0 4px 14px rgba(45,90,45,.18)" : "0 1px 2px rgba(0,0,0,.04)",
                  // Cap the whole card height so a packed library scans
                  // as a uniform mosaic rather than a scroll-out trap.
                  minHeight: 0
                }
              },
                /*#__PURE__*/React.createElement("div", { style: { position: "relative" } },
                  cardThumbnail(item),
                  linkedCount > 0 && /*#__PURE__*/React.createElement("div", {
                    "aria-label": linkedCount + " linked",
                    style: { position: "absolute", top: 4, right: 4, background: "rgba(17,24,39,.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999, lineHeight: 1.4 }
                  }, "🔗 " + linkedCount)
                ),
                /*#__PURE__*/React.createElement("div", {
                  style: { fontSize: 11, fontWeight: 700, color: "var(--c-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1, lineHeight: 1.25 }
                }, item.title || item.fileName || "Untitled"),
                /*#__PURE__*/React.createElement("div", {
                  style: { fontSize: 9, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                }, subtitle)
              );
            }))
          );
        })()
    );
    return myContentPanel;
  }

  window.MyContentPanel = MyContentPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = MyContentPanel;
  }
})();
