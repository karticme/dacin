"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CurrentPath({ breadcrumbs = [], onNavigate }) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return (
      <footer className="w-full h-10 bg-sidebar flex items-center justify-between border-t px-3.5" />
    );
  }

  return (
    <footer className="w-full h-10 bg-sidebar flex items-center justify-between border-t px-3.5 select-none">
      <Breadcrumb className="mb-px">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || "root"}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.(crumb.id);
                      }}
                      className="cursor-pointer"
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </footer>
  );
}
