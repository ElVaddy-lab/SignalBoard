"use client";

import { createContext } from "react";

import type { Project } from "@/data/projects";

export const ProjectsActionsContext = createContext<{
  createProject: () => void;
  deleteProject: (project: Project) => void;
  editProject: (project: Project) => void;
} | null>(null);
