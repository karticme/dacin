"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";

export default function CurrentPath() {
  return (
    <footer className="w-full h-10 bg-sidebar flex items-center justify-between border-t px-3.5">
      <Breadcrumb className="mb-px">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    className="-m-1.5 text-muted-foreground"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <BreadcrumbEllipsis />
              </MenuTrigger>
              <MenuPopup align="start">
                <MenuItem render={<a href="/hub" />}>Docs</MenuItem>
                <MenuItem render={<a href="/hub" />}>Particles</MenuItem>
              </MenuPopup>
            </Menu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="/" />}>
              Components
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </footer>
  );
}
