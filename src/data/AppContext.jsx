import { createContext, useContext, useState } from "react";
import { initialData } from "./store";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addMember(member) {
    setData(d => ({ ...d, members: [...d.members, member] }));
    showToast("Member added successfully");
  }

  function updateMember(id, updates) {
    setData(d => ({ ...d, members: d.members.map(m => m.id === id ? { ...m, ...updates } : m) }));
    showToast("Member updated");
  }

  function deleteMember(id) {
    setData(d => ({ ...d, members: d.members.filter(m => m.id !== id) }));
    showToast("Member removed");
  }

  function addBook(book) {
    setData(d => ({ ...d, books: [...d.books, book] }));
    showToast(`Book ${book.bookNumber} assigned successfully`);
  }

  function updateBook(id, updates) {
    setData(d => ({ ...d, books: d.books.map(b => b.id === id ? { ...b, ...updates } : b) }));
    showToast("Book updated");
  }

  function addCollection(col) {
    setData(d => {
      const newCols = [...d.collections, col];
      // auto update book status
      const book = d.books.find(b => b.id === col.bookId);
      if (book) {
        const bookCols = newCols.filter(c => c.bookId === col.bookId);
        const totalSold = bookCols.reduce((s, c) => s + c.ticketsSold, 0);
        const status = totalSold >= book.ticketCount ? "complete" : "ongoing";
        return {
          ...d,
          collections: newCols,
          books: d.books.map(b => b.id === col.bookId ? { ...b, status } : b),
        };
      }
      return { ...d, collections: newCols };
    });
    showToast("Collection recorded");
  }

  return (
    <AppContext.Provider value={{ data, addMember, updateMember, deleteMember, addBook, updateBook, addCollection, showToast, toast }}>
      {children}
      {toast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#3B6D11" : "#A32D2D",
          color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13,
          fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
