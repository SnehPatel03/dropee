"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  ArrowUpRight,
  ChevronRight,
  Cloud,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Download,
  FolderPlus,
  Grid3X3,
  Home,
  List,
  LogOut,
  Menu,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: "image" | "pdf" | "doc" | "other";
  size?: string;
  modified: string;
  starred: boolean;
  deleted: boolean;
  parentId: string | null;
  thumbnail?: string;
  url?: string;
};

const LoadingOverlay = ({ message }: { message?: string }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-background border border-border p-8 flex flex-col items-center gap-4 shadow-xl">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
        {message || "Processing..."}
      </p>
      <div className="h-0.5 w-12 bg-primary/20 overflow-hidden">
        <div className="h-full w-full bg-primary animate-pulse" />
      </div>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="border border-border bg-card p-3 sm:p-4 animate-pulse"
      >
        <div className="w-full aspect-square bg-muted mb-3 sm:mb-4" />
        <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-2 sm:h-3 bg-muted rounded w-1/2" />
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState("");
  const { user, isLoaded } = useUser();
  const [activeSection, setActiveSection] = useState<
    "files" | "starred" | "trash"
  >("files");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "All Files" }]);
  const [storage, setStorage] = useState({
    used: 0,
    limit: 0,
    remaining: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id;

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/storage");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setStorage(data);
      } catch (err) {
        console.error("Storage fetch error:", err);
      }
    };

    if (user?.id) {
      fetchStorage();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  const displayName =
    user?.fullName?.trim() ||
    (user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "") ||
    user?.username ||
    "User";

  const openMoveModal = (folderId: string) => {
    setMoveTargetFolder(folderId);
    setShowMoveModal(true);
  };

  const fetchFiles = async () => {
    try {
      setOperationLoading(true);
      setOperationMessage("Loading your files...");

      if (!user?.id) return;

      const res = await fetch(`/api/files?userId=${user.id}`);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to load files");
        return;
      }

      const mapped: FileItem[] = data.UserFiles.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.isFolder ? "folder" : "file",
        fileType: f.type?.startsWith("image")
          ? "image"
          : f.type?.includes("pdf")
            ? "pdf"
            : "other",
        size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : undefined,
        modified: new Date(f.createdAt).toLocaleDateString(),
        starred: f.isStarred,
        deleted: f.isTrash,
        parentId: f.parent_id,
        thumbnail: f.thumbnailUrl,
        url: f.fileUrl,
      }));

      setFiles(mapped);
    } catch (err) {
      toast.error("Something went wrong loading files");
    } finally {
      setLoading(false);
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const handleUpload = async (file: File, folderId?: string | null) => {
    if (!user?.id) {
      toast.error("User not logged in");
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP images and PDFs are allowed");
      return;
    }
    setUploading(true);
    setOperationLoading(true);
    setOperationMessage("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (folderId || currentFolderId) {
        formData.append("parent_id", folderId ?? currentFolderId!);
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      setFiles((prev) => [
        {
          id: data.id,
          name: data.name || "Untitled File",
          type: "file",
          fileType: data.type?.startsWith("image")
            ? "image"
            : data.type?.includes("pdf")
              ? "pdf"
              : "other",
          size: data.size ? `${(data.size / 1024).toFixed(1)} KB` : "Unknown",
          modified: "Just now",
          starred: false,
          deleted: false,
          parentId: data.parent_id || null,
          thumbnail: data.thumbnailUrl,
          url: data.fileUrl,
        },
        ...prev,
      ]);

      toast.success("File uploaded 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const createFolder = async (
    name: string,
    parent_id: string | null = null,
  ) => {
    if (!name || !userId) return;

    setOperationLoading(true);
    setOperationMessage("Creating folder...");

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const newFolder: FileItem = {
        id: data.folder.id,
        name: data.folder.name,
        type: "folder",
        modified: "Just now",
        starred: false,
        deleted: false,
        parentId: parent_id,
      };

      setFiles((prev) => [newFolder, ...prev]);
      toast.success("Folder created successfully");
      return data.folder;
    } catch (err) {
      console.error(err);
      toast.error("Failed to create folder");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const moveFile = async (fileId: string, folderId: string | null) => {
    setOperationLoading(true);
    setOperationMessage("Moving file...");

    try {
      const res = await fetch("/api/files/move", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          folderId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Move API Error:", text);
        throw new Error("Failed to move file");
      }

      const data = await res.json();
      console.log("File moved:", data.file);
      return data.file;
    } catch (error) {
      console.error("Move File Error:", error);
      toast.error("Failed to move file");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const handleMove = async (fileId: string) => {
    if (!moveTargetFolder) return;

    const updated = await moveFile(fileId, moveTargetFolder);

    if (updated) {
      toast.success("File added to folder");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, parentId: moveTargetFolder } : f,
        ),
      );

      setShowMoveModal(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder")
      return <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />;
    switch (file.fileType) {
      case "image":
        return <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "pdf":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "doc":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <File className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getFileColor = (file: FileItem) => {
    if (file.type === "folder") return "text-primary";
    switch (file.fileType) {
      case "image":
        return "text-emerald-600";
      case "pdf":
        return "text-rose-600";
      case "doc":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredFiles = files.filter((file) => {
    const fileName = file.name?.trim() || "Unnamed File";

    const matchesSearch = fileName
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase());

    if (activeSection === "trash") {
      return file.deleted && matchesSearch;
    }
    if (activeSection === "starred") {
      return file.starred && !file.deleted && matchesSearch;
    }
    return !file.deleted && file.parentId === currentFolderId && matchesSearch;
  });

  const toggleStar = async (id: string) => {
    setOperationLoading(true);
    setOperationMessage("Updating...");

    try {
      setFiles(
        files.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)),
      );

      const file = files.find((f) => f.id === id);
      const res = await fetch(`/api/files/${id}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !file?.starred }),
      });

      if (!res.ok) throw new Error("Failed to update star");

      toast.success(
        file?.starred ? "Removed from starred" : "Added to starred",
      );
    } catch (err) {
      console.error("Star error:", err);
      toast.error("Failed to update");
      setFiles(
        files.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)),
      );
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const moveToTrash = async (fileId: string) => {
    setOperationLoading(true);
    setOperationMessage("Moving to trash...");

    try {
      const res = await fetch(`/api/files/${fileId}/trash`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to move to trash");
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, deleted: true } : f)),
      );

      toast.success("Moved to trash");
    } catch (err) {
      console.error("Trash error:", err);
      toast.error("Failed to move to trash");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const permanentDelete = async (fileId: string) => {
    setOperationLoading(true);
    setOperationMessage("Deleting permanently...");

    try {
      const res = await fetch(`/api/files/${fileId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to Delete Permanently");
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("Deleted permanently");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const restoreFile = async (id: string) => {
    setOperationLoading(true);
    setOperationMessage("Restoring...");

    try {
      const res = await fetch(`/api/files/${id}/restore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to restore");

      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File restored");
    } catch (err) {
      console.error("Restore error:", err);
      toast.error("Failed to restore");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!file.url) return;

    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.info("Download started");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download");
    }
  };

  const openFolder = (folder: FileItem) => {
    if (folder.type === "folder" && !folder.deleted) {
      setCurrentFolderId(folder.id);
      setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
      setMobileMenuOpen(false);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;

    if (files.length > 0) {
      Array.from(files).forEach((file) => handleUpload(file));
    }
  };

  const { signOut } = useAuth();
  const router = useRouter();

  if (!isLoaded) return null;

  const handleLogOut = async () => {
    setOperationLoading(true);
    setOperationMessage("Logging out...");

    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.log("Logout error:", err);
      toast.error("Failed to logout");
    } finally {
      setOperationLoading(false);
      setOperationMessage("");
    }
  };

  const sidebarItems = [
    {
      id: "files",
      label: "ALL FILES",
      icon: Home,
      count: files.filter((f) => !f.deleted).length,
    },
    {
      id: "starred",
      label: "STARRED",
      icon: Star,
      count: files.filter((f) => f.starred && !f.deleted).length,
    },
    {
      id: "trash",
      label: "TRASH",
      icon: Trash2,
      count: files.filter((f) => f.deleted).length,
    },
  ];

  const handleSectionChange = (section: "files" | "starred" | "trash") => {
    setActiveSection(section);
    if (section !== "files") {
      setCurrentFolderId(null);
      setBreadcrumbs([
        { id: null, name: section === "starred" ? "Starred" : "Trash" },
      ]);
    } else {
      setBreadcrumbs([{ id: null, name: "All Files" }]);
    }
    setMobileMenuOpen(false);
  };

  const storageUsed = (storage.used / (1024 * 1024 * 1024)).toFixed(2);
  const storageTotal = (storage.limit / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercent =
    storage.limit > 0 ? (storage.used / storage.limit) * 100 : 0;

  return (
    <>
      {operationLoading && <LoadingOverlay message={operationMessage} />}

      <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-foreground text-background border-b border-background/10 p-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-bold tracking-tight"
          >
            drop<span className="text-primary">ee</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-background/10 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar - Mobile Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-foreground text-background flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-8 pb-6 flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="font-display text-3xl font-bold tracking-tight"
              >
                drop<span className="text-primary">ee</span>
              </Link>
              <p className="text-background/40 text-[10px] uppercase tracking-[0.2em] mt-2">
                Cloud Storage
              </p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-background/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 pb-8">
            <div className="group relative overflow-hidden p-4 bg-background/5 border border-background/10 hover:border-primary/50 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 -translate-y-1/2 translate-x-1/2 bg-primary/20 rotate-45 group-hover:bg-primary/40 transition-colors duration-500" />
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-primary/40 group-hover:w-full transition-all duration-700 ease-out" />
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-primary/30 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                  <div className="relative w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold font-display transform group-hover:scale-105 transition-transform duration-300">
                    {displayName.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors duration-300">
                      {displayName || "User"}
                    </p>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                  <p className="text-background/50 text-xs truncate">
                    {user?.primaryEmailAddress?.emailAddress || "No email"}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-primary/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View Profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 overflow-y-auto">
            <p className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] text-background/40 font-display">
              Navigate
            </p>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    handleSectionChange(
                      item.id as "files" | "starred" | "trash",
                    )
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs font-display font-bold tracking-wider transition-all group ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-background/60 hover:bg-background/5 hover:text-background"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-4 h-4 ${activeSection === item.id ? "" : "opacity-60"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 font-mono ${
                      activeSection === item.id
                        ? "bg-primary-foreground/20"
                        : "bg-background/10"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
            {showMoveModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-background border border-border w-full max-w-[420px] max-h-[500px] overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
                      Add Existing File
                    </h2>
                    <button
                      onClick={() => setShowMoveModal(false)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {files
                      .filter(
                        (f) =>
                          f.type === "file" &&
                          !f.deleted &&
                          f.parentId !== moveTargetFolder,
                      )
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between px-5 py-3 border-b border-border hover:bg-muted/50 transition"
                        >
                          <div className="flex flex-col min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {file.size || "File"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleMove(file.id)}
                            className="text-xs font-bold px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    {files.filter(
                      (f) =>
                        f.type === "file" &&
                        !f.deleted &&
                        f.parentId !== moveTargetFolder,
                    ).length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No files available
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => setShowMoveModal(false)}
                      className="w-full py-2 text-xs font-display font-bold tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-background/10">
              <p className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] text-background/40 font-display">
                Actions
              </p>
              <button
                onClick={() => {
                  const name = prompt("Enter folder name");
                  if (name && userId) createFolder(name, null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-display font-bold tracking-wider text-background/60 hover:bg-background/5 hover:text-background transition-all"
              >
                <FolderPlus className="w-4 h-4 opacity-60" />
                New Folder
              </button>
              <button
                disabled={uploading}
                className={`w-full flex items-center gap-3 text-xs font-display font-bold tracking-wider hover:bg-primary/10 transition-all px-5 py-2.5 text-background ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleBrowseClick}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </nav>

          <div className="p-4 mt-auto">
            <div className="p-5 bg-background/5 border border-background/10 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-background/40 font-display">
                  Storage
                </p>
                <Cloud className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl sm:text-3xl font-display font-bold">
                  {storageUsed}
                </span>
                <span className="text-background/50 text-xs sm:text-sm">
                  / {storageTotal} GB
                </span>
              </div>
              <div className="h-1 bg-background/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-background/40 mt-2 uppercase tracking-wider">
                {Math.round(storagePercent)}% used
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleLogOut()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-display font-bold tracking-wider text-background/50 hover:text-background border border-background/10 hover:bg-[#D31100] hover:text-[11px] transition-all duration-300 hover:border-background/20"
              >
                <LogOut className="w-3 h-3" />
                LOGOUT
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col mt-16 lg:mt-0">
          <header className="border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:px-8 gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    )}
                    <button
                      onClick={() => navigateToBreadcrumb(index)}
                      className={`hover:text-primary transition uppercase tracking-wider text-xs ${
                        index === breadcrumbs.length - 1
                          ? "text-foreground font-medium"
                          : ""
                      }`}
                    >
                      <span className="truncate max-w-[100px] sm:max-w-none inline-block">
                        {crumb.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight uppercase">
                {activeSection === "starred"
                  ? "Starred Files"
                  : activeSection === "trash"
                    ? "Trash Bin"
                    : "Your Files"}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto flex-wrap">
              {activeSection === "files" && currentFolderId && (
                <button
                  onClick={() => {
                    setMoveTargetFolder(currentFolderId);
                    setShowMoveModal(true);
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground text-xs font-display font-bold tracking-wider hover:opacity-90 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">ADD FILE</span>
                  <span className="sm:hidden">ADD</span>
                </button>
              )}
              {currentFolderId && (
                <button
                  onClick={() => {
                    if (breadcrumbs.length > 1) {
                      const newBreadcrumbs = breadcrumbs.slice(0, -1);
                      const last = newBreadcrumbs[newBreadcrumbs.length - 1];
                      setBreadcrumbs(newBreadcrumbs);
                      setCurrentFolderId(last.id);
                    }
                  }}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 text-xs font-display font-bold tracking-wider border border-border hover:border-foreground transition"
                >
                  ← BACK
                </button>
              )}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center border border-border relative z-10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 overflow-auto">
            {activeSection === "files" && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mb-6 sm:mb-8 border-2 border-dashed transition-all duration-300 ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all ${
                        isDragging
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-xs sm:text-sm uppercase tracking-wide">
                        {uploading
                          ? "Uploading..."
                          : isDragging
                            ? "Drop to upload"
                            : "Drag & drop files"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        click to browse files (only images and PDFs up to 10
                        MB).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBrowseClick}
                    className={`px-4 sm:px-5 py-2 bg-foreground text-background flex items-center gap-2 text-xs sm:text-sm ${
                      uploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={uploading}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Browse
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <LoadingSkeleton />
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted flex items-center justify-center mb-4 sm:mb-6">
                  {activeSection === "starred" ? (
                    <Star className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  ) : activeSection === "trash" ? (
                    <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  ) : (
                    <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide mb-2">
                  {activeSection === "starred"
                    ? "No Starred Items"
                    : activeSection === "trash"
                      ? "Trash is Empty"
                      : "No Files Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  {activeSection === "starred"
                    ? "Star your important files and folders to find them quickly here."
                    : activeSection === "trash"
                      ? "Items you delete will appear here for 30 days."
                      : "Upload files or create folders to get started."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border gap-4">
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        Total Items
                      </p>
                      <p className="font-display text-xl sm:text-2xl font-bold">
                        {filteredFiles.length}
                      </p>
                    </div>
                    <div className="w-px h-8 sm:h-10 bg-border" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        Folders
                      </p>
                      <p className="font-display text-xl sm:text-2xl font-bold">
                        {
                          filteredFiles.filter((f) => f.type === "folder")
                            .length
                        }
                      </p>
                    </div>
                    <div className="w-px h-8 sm:h-10 bg-border" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        Files
                      </p>
                      <p className="font-display text-xl sm:text-2xl font-bold">
                        {filteredFiles.filter((f) => f.type === "file").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                      : "space-y-2"
                  }
                >
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative border border-border bg-card hover:border-foreground transition-all duration-200 ${
                        viewMode === "grid"
                          ? "overflow-hidden"
                          : "flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
                      }`}
                    >
                      {viewMode === "grid" ? (
                        <>
                          <div
                            className="cursor-pointer p-3 sm:p-4"
                            onClick={() =>
                              file.type === "folder" && openFolder(file)
                            }
                          >
                            <div
                              className={`w-full aspect-square bg-muted flex items-center justify-center mb-3 sm:mb-4 ${getFileColor(file)} group-hover:scale-[1.02] transition-transform`}
                            >
                              {getFileIcon(file)}
                            </div>
                            <p className="text-xs sm:text-sm font-display font-bold truncate uppercase tracking-wide">
                              {file.name?.trim() ? file.name : "Untitled File"}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">
                                {file.size || "Folder"}
                              </p>
                              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">
                                {file.modified}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons - Always visible on mobile, hover on desktop */}
                          <div className="absolute top-2 right-2 flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {activeSection === "trash" ? (
                              <>
                                <button
                                  onClick={() => restoreFile(file.id)}
                                  className="p-1.5 sm:p-2 bg-background border border-border rounded hover:border-primary hover:text-primary transition"
                                  title="Restore"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => permanentDelete(file.id)}
                                  className="p-1.5 sm:p-2 bg-background border border-border rounded hover:border-destructive hover:text-destructive transition"
                                  title="Delete permanently"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                {file.type === "file" && (
                                  <>
                                    <button
                                      onClick={() => toggleStar(file.id)}
                                      className={`p-1.5 sm:p-2 bg-background border rounded transition ${
                                        file.starred
                                          ? "border-primary text-primary"
                                          : "border-border hover:border-primary hover:text-primary"
                                      }`}
                                      title={file.starred ? "Unstar" : "Star"}
                                    >
                                      <Star
                                        className={`w-3 h-3 ${file.starred ? "fill-current" : ""}`}
                                      />
                                    </button>
                                    <button
                                      onClick={() => handleDownload(file)}
                                      className="p-1.5 sm:p-2 bg-background border border-border rounded hover:border-primary hover:text-primary transition"
                                      title="Download"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (file.url) {
                                          window.open(file.url, "_blank");
                                        }
                                      }}
                                      className="p-1.5 sm:p-2 bg-background border border-border rounded hover:border-primary hover:text-primary transition"
                                      title="Preview"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => moveToTrash(file.id)}
                                  className="p-1.5 sm:p-2 bg-background border border-border rounded hover:border-destructive hover:text-destructive transition"
                                  title="Move to trash"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          {file.type === "folder" && (
                            <div className="absolute bottom-2 left-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMoveModal(file.id);
                                }}
                                className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-1 bg-primary text-white rounded whitespace-nowrap"
                              >
                                Add Existing
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        // List View
                        <>
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-muted ${getFileColor(file)} cursor-pointer flex-shrink-0 rounded`}
                            onClick={() =>
                              file.type === "folder" && openFolder(file)
                            }
                          >
                            {getFileIcon(file)}
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() =>
                              file.type === "folder" && openFolder(file)
                            }
                          >
                            <p className="text-xs sm:text-sm font-display font-bold truncate uppercase tracking-wide">
                              {file.name}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                              {file.size || "Folder"} • {file.modified}
                            </p>
                          </div>
                          
                          {/* Action Buttons - Always visible on mobile, hover on desktop */}
                          <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {activeSection === "trash" ? (
                              <>
                                <button
                                  onClick={() => restoreFile(file.id)}
                                  className="p-1.5 sm:p-2 hover:text-primary transition rounded"
                                  title="Restore"
                                >
                                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={() => permanentDelete(file.id)}
                                  className="p-1.5 sm:p-2 hover:text-destructive transition rounded"
                                  title="Delete permanently"
                                >
                                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                {file.type === "file" && (
                                  <>
                                    <button
                                      onClick={() => toggleStar(file.id)}
                                      className={`p-1.5 sm:p-2 transition rounded ${
                                        file.starred ? "text-primary" : "hover:text-primary"
                                      }`}
                                      title={file.starred ? "Unstar" : "Star"}
                                    >
                                      <Star
                                        className={`w-3 h-3 sm:w-4 sm:h-4 ${file.starred ? "fill-current" : ""}`}
                                      />
                                    </button>
                                    <button
                                      onClick={() => handleDownload(file)}
                                      className="p-1.5 sm:p-2 hover:text-primary transition rounded"
                                      title="Download"
                                    >
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (file.url) {
                                          window.open(file.url, "_blank");
                                        }
                                      }}
                                      className="p-1.5 sm:p-2 hover:text-primary transition rounded"
                                      title="Preview"
                                    >
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => moveToTrash(file.id)}
                                  className="p-1.5 sm:p-2 hover:text-destructive transition rounded"
                                  title="Move to trash"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />
    </>
  );
}