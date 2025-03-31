"use client";

import Sidebar from "@/components/layout/sidebar";
import React from 'react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white dark:bg-secondary-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden bg-white dark:bg-secondary-900">
        {children}
      </div>
    </div>
  );
} 