// // src/pages/LibraryOps.jsx
// import React, { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import Loader from "../components/common/Loader";
// import {
//   getBooks,
//   addBook,
//   editBook,
//   deleteBook,

// } from "../api/libraryApi";

// import AddBook from "../components/libraryOps/AddBook";
// import EditBook from "../components/libraryOps/EditBook";
// import DeleteBook from "../components/libraryOps/DeleteBook";
// import BookList from "../components/library/BookList";

// // ✅ Barcode Components
// import BarcodeScanner from "../components/barcode/BarcodeScanner";
// import ManualScanInput from "../components/barcode/ManualScanInput";
// import ScanResultCard from "../components/barcode/ScanResultCard";

// export default function LibraryOps() {
//   const [books, setBooks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedBook, setSelectedBook] = useState(null);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

//   // 🔍 Barcode scanning states
//   const [scanResult, setScanResult] = useState(null);
//   const [scanning, setScanning] = useState(false);
//   const [isScannerActive, setIsScannerActive] = useState(false);

//   // ✅ Load all books from backend
//   const loadBooks = async () => {
//     try {
//       setLoading(true);
//       const data = await getBooks();
//       setBooks(data);
//     } catch (error) {
//       console.error("Error loading books:", error);
//       toast.error("Failed to load books.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadBooks();
//   }, []);

//   // ✅ Handle Add Book
//   const handleAddBook = async (formData) => {
//     try {
//       await addBook(formData);
//       toast.success("Book added successfully.");
//       setIsAddModalOpen(false);
//       loadBooks();
//     } catch (error) {
//       toast.error("Error adding book.");
//     }
//   };

//   // ✅ Handle Edit Book
//   const handleEditBook = async (bookId, updatedData) => {
//     try {
//       await updateBook(bookId, updatedData);
//       toast.success("Book updated successfully.");
//       setIsEditModalOpen(false);
//       loadBooks();
//     } catch (error) {
//       toast.error("Error updating book.");
//     }
//   };

//   // ✅ Handle Delete Book
//   const handleDeleteBook = async (bookId) => {
//     try {
//       await deleteBook(bookId);
//       toast.success("Book deleted successfully.");
//       setIsDeleteModalOpen(false);
//       loadBooks();
//     } catch (error) {
//       toast.error("Error deleting book.");
//     }
//   };

//   // ✅ Barcode Scanning Logic
//   const handleDetected = async (barcodeValue) => {
//     setScanning(true);
//     toast.loading("🔍 Scanning barcode...");
//     try {
//       const data = await scanBarcode(barcodeValue);
//       setScanResult(data);
//       toast.dismiss();
//       toast.success("Book found!");
//       setIsScannerActive(false); // Stop camera after detection
//     } catch (err) {
//       toast.dismiss();
//       toast.error("Invalid barcode or book not found.");
//     } finally {
//       setScanning(false);
//     }
//   };

//   // ✅ Approve Borrow (on scan)
//   const handleApprove = async () => {
//     if (!scanResult) return;
//     try {
//       await approveBorrow(scanResult.copy_id, scanResult.barcode_value);
//       toast.success("✅ Book issued successfully!");
//       setScanResult(null);
//     } catch (err) {
//       toast.error("Error issuing book.");
//     }
//   };

//   // ✅ Mark Return (on scan)
//   const handleReturn = async () => {
//     if (!scanResult) return;
//     try {
//       await markReturned(scanResult.copy_id, scanResult.barcode_value);
//       toast.success("📘 Book returned successfully!");
//       setScanResult(null);
//     } catch (err) {
//       toast.error("Error marking return.");
//     }
//   };

//   if (loading) return <Loader />;

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
//       {/* ---------------------------------------------------------------- */}
//       {/* 📚 LIBRARY CRUD SECTION */}
//       {/* ---------------------------------------------------------------- */}
//       <section>
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-blue-700">
//             📚 Library Management
//           </h1>
//           <button
//             onClick={() => setIsAddModalOpen(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md"
//           >
//             ➕ Add Book
//           </button>
//         </div>

//         {books.length > 0 ? (
//           <BookList
//             books={books}
//             onEdit={(book) => {
//               setSelectedBook(book);
//               setIsEditModalOpen(true);
//             }}
//             onDelete={(book) => {
//               setSelectedBook(book);
//               setIsDeleteModalOpen(true);
//             }}
//           />
//         ) : (
//           <p className="text-center text-gray-500 mt-10">No books found.</p>
//         )}

//         {/* Modals */}
//         {isAddModalOpen && (
//           <AddBook onSubmit={handleAddBook} onClose={() => setIsAddModalOpen(false)} />
//         )}
//         {isEditModalOpen && selectedBook && (
//           <EditBook
//             book={selectedBook}
//             onSubmit={(data) => handleEditBook(selectedBook.book_id, data)}
//             onClose={() => setIsEditModalOpen(false)}
//           />
//         )}
//         {isDeleteModalOpen && selectedBook && (
//           <DeleteBook
//             book={selectedBook}
//             onConfirm={() => handleDeleteBook(selectedBook.book_id)}
//             onClose={() => setIsDeleteModalOpen(false)}
//           />
//         )}
//       </section>

//       {/* ---------------------------------------------------------------- */}
//       {/* 📸 BARCODE SCANNER SECTION */}
//       {/* ---------------------------------------------------------------- */}
//       <section className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
//         <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
//           📸 Barcode Scanner – Issue & Return
//         </h2>

//         <div className="flex flex-col items-center gap-4">
//           {!isScannerActive ? (
//             <button
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md"
//               onClick={() => setIsScannerActive(true)}
//             >
//               🎥 Start Scanning
//             </button>
//           ) : (
//             <>
//               <BarcodeScanner onDetected={handleDetected} />
//               <button
//                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md mt-3"
//                 onClick={() => setIsScannerActive(false)}
//               >
//                 ✖ Stop Scanning
//               </button>
//             </>
//           )}

//           {/* Manual entry always visible */}
//           <ManualScanInput onSubmit={handleDetected} />
//         </div>

//         {scanning && (
//           <p className="text-center text-gray-500 mt-4">Processing barcode...</p>
//         )}

//         {scanResult && (
//           <ScanResultCard
//             data={scanResult}
//             onApprove={handleApprove}
//             onReturn={handleReturn}
//           />
//         )}
//       </section>
//     </div>
//   );
// }
