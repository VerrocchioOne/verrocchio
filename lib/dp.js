// lib/dp.js
//
// HTML5 drag-and-drop reorder helper. Returns the event-handler bag
// for a draggable list item; calls reorder(newArray) on drop. Used by
// the Goals tab custom-order drag (index.html L11408). Module-scope
// _dr tracks the current from/over indices across drag events on the
// same list — fine because only one HTML5 drag is in flight at a time.
//
// Originally inline at index.html L1733-L1769 (37 LOC).

const _dr = {
  from: null,
  over: null
};
function dp(idx, items, reorder) {
  return {
    draggable: true,
    onDragStart: e => {
      _dr.from = idx;
      e.dataTransfer.effectAllowed = "move";
    },
    onDragEnter: () => {
      _dr.over = idx;
    },
    onDragOver: e => {
      e.preventDefault();
    },
    onDrop: e => {
      e.preventDefault();
      if (_dr.from === null || _dr.over === null || _dr.from === _dr.over) {
        _dr.from = null;
        _dr.over = null;
        return;
      }
      const n = [...items];
      const [m] = n.splice(_dr.from, 1);
      n.splice(_dr.over, 0, m);
      reorder(n);
      _dr.from = null;
      _dr.over = null;
    },
    onDragEnd: () => {
      _dr.from = null;
      _dr.over = null;
    }
  };
}
