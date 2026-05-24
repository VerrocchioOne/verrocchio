// lib/views/profile/InspirationPanel.js
//
// Profile > My Inspiration panel: liked/disliked quote buckets + custom
// quote editor with add / search / inline-edit / delete.
//
// Wave 4.4.2. Originally inline at index.html L15580-L15684 (quote
// helpers + inspirationPanel inside the showProfile IIFE).
//
// VERBATIM body extraction. The quote-helper closures (qKeyP /
// likedQuotesList / dislikedQuotesList / removeFromList / quoteGroup)
// that lived between accountPanel and inspirationPanel in the inline
// source are re-built inline here because they're only used by this
// panel.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function InspirationPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data;
    const save = h.save || (() => {});
    const sectionTitle = h.sectionTitle;
    const labelS = h.labelS;
    const IS = h.IS;
    const AB = h.AB;
    const EI = h.EI;
    const SC = h.SC;
    const nQ = h.nQ || "";
    const sNQ = h.sNQ || (() => {});
    const nQA = h.nQA || "";
    const sNQA = h.sNQA || (() => {});
    const addQ = h.addQ || (() => {});
    const qFilter = h.qFilter || "";
    const setQFilter = h.setQFilter || (() => {});
    const allQuotes = h.allQuotes || [];
    const eQId = h.eQId;
    const eQTxt = h.eQTxt || "";
    const sEQTxt = h.sEQTxt || (() => {});
    const eQA = h.eQA || "";
    const sEQA = h.sEQA || (() => {});
    const svEQ = h.svEQ || (() => {});
    const sEQId = h.sEQId || (() => {});
    const sEQ = h.sEQ || (() => {});
    const delQ = h.delQ || (() => {});

    const qKeyP = (x) => (x.text || "") + "|" + (x.author || "");
    const likedQuotesList = data.likedQuotes || [];
    const dislikedQuotesList = data.dislikedQuotes || [];
    const removeFromList = (bucket, q) => {
      const next = (data[bucket] || []).filter(x => qKeyP(x) !== qKeyP(q));
      save({ ...data, [bucket]: next });
    };
    const quoteGroup = (title, bucket, list, accent) => {
      if (!list.length) return null;
      return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }
        },
          /*#__PURE__*/React.createElement("span", { style: { fontSize: 13 } }, accent),
          /*#__PURE__*/React.createElement("span", null, title),
          /*#__PURE__*/React.createElement("span", { style: { color: "#d1d5db", fontWeight: 500 } }, "(" + list.length + ")")
        ),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          list.map((q, i) => /*#__PURE__*/React.createElement("div", {
            key: bucket + "-" + i,
            style: { background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8 }
          },
            /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              /*#__PURE__*/React.createElement("div", {
                style: { fontSize: 12, fontStyle: "italic", color: "var(--c-text-soft)", lineHeight: 1.5, marginBottom: q.author ? 4 : 0 }
              }, "\"", q.text, "\""),
              q.author ? /*#__PURE__*/React.createElement("div", {
                style: { fontSize: 11, color: "#2d5a2d", fontWeight: 600 }
              }, "— ", q.author) : null
            ),
            /*#__PURE__*/React.createElement("button", {
              "aria-label": "Remove",
              onClick: () => removeFromList(bucket, q),
              style: { background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }
            }, "\xD7")
          ))
        )
      );
    };

    return /*#__PURE__*/React.createElement("div", null,
      sectionTitle("My Inspiration"),
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#9ca3af", marginBottom: 12 } }, "Your personal quote collection."),
      quoteGroup("Liked", "likedQuotes", likedQuotesList, "👍"),
      quoteGroup("Disliked", "dislikedQuotes", dislikedQuotesList, "👎"),
      /*#__PURE__*/React.createElement("div", {
        style: { background: "var(--c-surface-raised)", borderRadius: 10, padding: "12px", marginBottom: 12 }
      },
        /*#__PURE__*/React.createElement("textarea", {
          value: nQ,
          onChange: e => sNQ(e.target.value),
          placeholder: "Add a quote...",
          rows: 2,
          style: { width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", color: "var(--c-text)", fontSize: 13, lineHeight: 1.6, marginBottom: 6, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }
        }),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 6 } },
          /*#__PURE__*/React.createElement("input", {
            value: nQA,
            onChange: e => sNQA(e.target.value),
            placeholder: "Author (optional)",
            style: { ...IS, flex: 1 }
          }),
          /*#__PURE__*/React.createElement("button", {
            onClick: addQ,
            style: { ...AB, padding: "8px 14px", fontSize: 12 }
          }, "Add"))),
      /*#__PURE__*/React.createElement("input", {
        value: qFilter,
        onChange: e => setQFilter(e.target.value),
        placeholder: "Search quotes...",
        style: { ...IS, width: "100%", marginBottom: 10, boxSizing: "border-box" }
      }),
      /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        allQuotes.filter(q => !qFilter || q.text.toLowerCase().includes(qFilter.toLowerCase()) || q.author.toLowerCase().includes(qFilter.toLowerCase())).map(q => {
          const isCustom = q.custom;
          const isE = eQId === q.id;
          return /*#__PURE__*/React.createElement("div", {
            key: q.id,
            style: { background: isCustom ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)", border: `1px solid ${isCustom ? "#c6dfc6" : "var(--c-border)"}`, borderRadius: 10, padding: "10px 12px", position: "relative" }
          }, isE ? /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("textarea", {
              value: eQTxt,
              onChange: e => sEQTxt(e.target.value),
              rows: 2,
              autoFocus: true,
              style: { width: "100%", background: "#fff", border: "1px solid #2d5a2d", borderRadius: 6, padding: "6px 8px", color: "var(--c-text)", fontSize: 12, outline: "none", marginBottom: 6, resize: "none", boxSizing: "border-box" }
            }),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 5 } },
              /*#__PURE__*/React.createElement("input", {
                value: eQA,
                onChange: e => sEQA(e.target.value),
                placeholder: "Author",
                style: { ...EI, flex: 1, fontSize: 12 }
              }),
              /*#__PURE__*/React.createElement(SC, { onSave: () => svEQ(q.id), onCancel: () => sEQId(null) }))
          ) : /*#__PURE__*/React.createElement(React.Fragment, null,
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, fontStyle: "italic", color: "var(--c-text-soft)", lineHeight: 1.5, marginBottom: q.author ? 4 : 0 } }, "\"", q.text, "\""),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
              q.author ? /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "#2d5a2d", fontWeight: 600 } }, "— ", q.author) : /*#__PURE__*/React.createElement("span", null),
              !isCustom && /*#__PURE__*/React.createElement("span", { style: { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5 } }, "Collection"),
              isCustom && /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 2 } },
                /*#__PURE__*/React.createElement("button", { "aria-label": "Edit", onClick: () => sEQ(q), style: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12, padding: "2px" } }, "✎"),
                /*#__PURE__*/React.createElement("button", { "aria-label": "Close", onClick: () => delQ(q.id), style: { background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 15, padding: "2px", lineHeight: 1 } }, "\xD7"))))
          );
        }))
    );
  }

  window.InspirationPanel = InspirationPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = InspirationPanel;
  }
})();
