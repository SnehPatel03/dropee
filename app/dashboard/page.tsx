"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

import {
  Search,
  Bell,
  FolderOpen,
  Star,
  Trash2,
  Upload,
  Grid3X3,
  List,
  MoreVertical,
  File,
  FileText,
  FileImage,
  ChevronRight,
  Plus,
  X,
  RotateCcw,
  FolderPlus,
  Home,
  Settings,
  LogOut,
  Cloud,
  ArrowUpRight,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

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
};

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id;
  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);
  const openMoveModal = (folderId: string) => {
    setMoveTargetFolder(folderId);
    setShowMoveModal(true);
  };
  const fetchFiles = async () => {
    try {
      setLoading(true);

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
      }));

      setFiles(mapped);
    } catch (err) {
      toast.error("Something went wrong loading files");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, folderId?: string | null) => {
    if (!user?.id) {
      toast.error("User not logged in");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 👇 use passed folder OR fallback to current folder
      const targetFolder = folderId ?? currentFolderId;

      if (targetFolder) {
        formData.append("parent_id", targetFolder);
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Upload failed");
        return;
      }

      toast.success("File uploaded 🎉");

      // update UI
      setFiles((prev) => [
        {
          id: data.id,
          name: data.name,
          type: "file",
          fileType: data.type?.startsWith("image")
            ? "image"
            : data.type?.includes("pdf")
              ? "pdf"
              : "other",
          size: data.size ? `${(data.size / 1024).toFixed(1)} KB` : undefined,
          modified: "Just now",
          starred: false,
          deleted: false,
          parentId: data.parent_id || null,
          thumbnail: data.thumbnailUrl,
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async (
    name: string,
    parent_id: string | null = null,
  ) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          userId, // from Clerk
          // parent_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      console.log("Folder created:", data.folder);
      return data.folder;
    } catch (err) {
      console.error(err);
    }
  };

  const moveFile = async (fileId: string, folderId: string | null) => {
    try {
      const res = await fetch("/api/files/move", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          folderId, // null = move to root
        }),
      });

      // Handle non-JSON / error safely
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
    }
  };
  const handleMove = async (fileId: string) => {
    if (!moveTargetFolder) return;

    const updated = await moveFile(fileId, moveTargetFolder);

    if (updated) {
      toast.success("File added to folder");

      // update UI instantly
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
    if (file.type === "folder") return <FolderOpen className="w-5 h-5" />;
    switch (file.fileType) {
      case "image":
        return <FileImage className="w-5 h-5" />;
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "doc":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
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
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeSection === "trash") {
      return file.deleted && matchesSearch;
    }
    if (activeSection === "starred") {
      return file.starred && !file.deleted && matchesSearch;
    }
    return !file.deleted && file.parentId === currentFolderId && matchesSearch;
  });

  const toggleStar = (id: string) => {
    setFiles(
      files.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)),
    );
  };

  const moveToTrash = (id: string) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, deleted: true } : f)));
  };

  const restoreFile = (id: string) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, deleted: false } : f)));
  };

  const permanentDelete = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const openFolder = (folder: FileItem) => {
    if (folder.type === "folder" && !folder.deleted) {
      setCurrentFolderId(folder.id);
      setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
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
  };

  const storageUsed = 4.2;
  const storageTotal = 15;
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-72 bg-foreground text-background flex flex-col">
        <div className="p-8 pb-6">
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

        <div className="px-8 pb-8">
          <div className="flex items-center gap-4 p-4 bg-background/5 border border-background/10">
            <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold font-display">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm truncate">
                John Doe
              </p>
              <p className="text-background/50 text-xs truncate">
                john@dropee.io
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <p className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] text-background/40 font-display">
            Navigate
          </p>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  handleSectionChange(item.id as "files" | "starred" | "trash")
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-background border border-border w-[420px] max-h-[500px] overflow-hidden shadow-xl">
                {/* Header */}
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

                {/* File List */}
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
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {file.size || "File"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleMove(file.id)}
                          className="text-xs font-bold px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 transition"
                        >
                          Add
                        </button>
                      </div>
                    ))}

                  {/* Empty state */}
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

                {/* Footer */}
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

                if (!name || !userId) return;

                createFolder(name, null); // or parent_id if inside folder
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-display font-bold tracking-wider text-background/60 hover:bg-background/5 hover:text-background transition-all"
            >
              <FolderPlus className="w-4 h-4 opacity-60" />
              New Folder
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-display font-bold tracking-wider text-primary hover:bg-primary/10 transition-all">
              <Upload className="w-4 h-4" />
              <span>UPLOAD FILES</span>
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
              <span className="text-3xl font-display font-bold">
                {storageUsed}
              </span>
              <span className="text-background/50 text-sm">
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

          {/* Bottom Links */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-display font-bold tracking-wider text-background/50 hover:text-background border border-background/10 hover:border-background/20 transition-all">
              <Settings className="w-3 h-3" />
              SETTINGS
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-display font-bold tracking-wider text-background/50 hover:text-background border border-background/10 hover:border-background/20 transition-all">
              <LogOut className="w-3 h-3" />
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-border flex items-center justify-between px-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-3 h-3" />}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`hover:text-primary transition uppercase tracking-wider ${
                      index === breadcrumbs.length - 1
                        ? "text-foreground font-medium"
                        : ""
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight uppercase">
              {activeSection === "starred"
                ? "Starred Files"
                : activeSection === "trash"
                ? "Trash Bin"
                : "Your Files"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {activeSection === "files" && currentFolderId && (
              <button
              onClick={() => {
                setMoveTargetFolder(currentFolderId); // 👈 current open folder
                setShowMoveModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-display font-bold tracking-wider hover:opacity-90 transition"
              >
                <Upload className="w-4 h-4" />
                ADD FILE
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
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-display font-bold tracking-wider border border-border hover:border-foreground transition"
    >
      ← BACK
    </button>
  )}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-11 pr-4 py-2.5 bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button className="relative p-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Upload Zone */}
          {activeSection === "files" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-8 border-2 border-dashed transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/40"
              }`}
            >
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

              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-14 h-14 flex items-center justify-center transition-all ${
                      isDragging
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm uppercase tracking-wide">
                      {uploading
                        ? "Uploading..."
                        : isDragging
                          ? "Drop to upload"
                          : "Drag & drop files"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse from your computer
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBrowseClick}
                  className={`px-5 py-2.5 bg-foreground text-background ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={uploading}
                >
                  <Plus className="w-4 h-4" />
                  Browse Files
                </button>
              </div>
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-muted flex items-center justify-center mb-6">
                {activeSection === "starred" ? (
                  <Star className="w-8 h-8 text-muted-foreground" />
                ) : activeSection === "trash" ? (
                  <Trash2 className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                {activeSection === "starred"
                  ? "No Starred Items"
                  : activeSection === "trash"
                    ? "Trash is Empty"
                    : "No Files Yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {activeSection === "starred"
                  ? "Star your important files and folders to find them quickly here."
                  : activeSection === "trash"
                    ? "Items you delete will appear here for 30 days."
                    : "Upload files or create folders to get started."}
              </p>
            </div>
          )}

          {/* Files Grid/List */}
          {filteredFiles.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border ml-6 ">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Total Items
                    </p>
                    <p className="font-display text-2xl font-bold">
                      {filteredFiles.length}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Folders
                    </p>
                    <p className="font-display text-2xl font-bold">
                      {filteredFiles.filter((f) => f.type === "folder").length}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Files
                    </p>
                    <p className="font-display text-2xl font-bold">
                      {filteredFiles.filter((f) => f.type === "file").length}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "space-y-2"
                }
              >
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative border border-border bg-card hover:border-foreground transition-all duration-200 ${
                      viewMode === "grid" ? "" : "flex items-center gap-4 p-4"
                    }`}
                  >
                    {/* Grid View */}
                    {viewMode === "grid" ? (
                      <>
                        <div
                          className="cursor-pointer p-4"
                          onClick={() =>
                            file.type === "folder" && openFolder(file)
                          }
                        >
                          <div
                            className={`w-full aspect-square bg-muted flex items-center justify-center mb-4 ${getFileColor(file)} group-hover:scale-[1.02] transition-transform`}
                          >
                            {getFileIcon(file)}
                          </div>
                          <p className="text-sm font-display font-bold truncate uppercase tracking-wide">
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {file.size || "Folder"}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {file.modified}
                            </p>
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {activeSection === "trash" ? (
                            <>
                              <button
                                onClick={() => restoreFile(file.id)}
                                className="p-2 bg-background border border-border hover:border-primary hover:text-primary transition"
                                title="Restore"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => permanentDelete(file.id)}
                                className="p-2 bg-background border border-border hover:border-destructive hover:text-destructive transition"
                                title="Delete permanently"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleStar(file.id)}
                                className={`p-2 bg-background border transition ${
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
                                onClick={() => moveToTrash(file.id)}
                                className="p-2 bg-background border border-border hover:border-destructive hover:text-destructive transition"
                                title="Move to trash"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button className="p-2 bg-background border border-border hover:border-foreground transition">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Open indicator for folders */}
                        {file.type === "folder" && (
                          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openMoveModal(file.id); // folder id
                              }}
                              className="text-[10px] px-2 py-1 bg-primary text-white"
                            >
                              Add Existing
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          className={`w-12 h-12 flex items-center justify-center bg-muted ${getFileColor(file)} cursor-pointer`}
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
                          <p className="text-sm font-display font-bold truncate uppercase tracking-wide">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            {file.size || "Folder"} • {file.modified}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeSection === "trash" ? (
                            <>
                              <button
                                onClick={() => restoreFile(file.id)}
                                className="p-2 hover:text-primary transition"
                                title="Restore"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => permanentDelete(file.id)}
                                className="p-2 hover:text-destructive transition"
                                title="Delete permanently"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleStar(file.id)}
                                className={`p-2 transition ${file.starred ? "text-primary" : "hover:text-primary"}`}
                                title={file.starred ? "Unstar" : "Star"}
                              >
                                <Star
                                  className={`w-4 h-4 ${file.starred ? "fill-current" : ""}`}
                                />
                              </button>
                              <button
                                onClick={() => moveToTrash(file.id)}
                                className="p-2 hover:text-destructive transition"
                                title="Move to trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:text-foreground transition">
                                <MoreVertical className="w-4 h-4" />
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
  );
}
