import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardPenLine,
  LayoutDashboard,
  Package,
  Table2,
} from "lucide-react";

export const APP_NAME = "DropFlow";
export const APP_DESCRIPTION =
  "Sistema financiero y operativo para administrar dropshipping en MXN.";

export const ALERT_THRESHOLDS = {
  lowNetMargin: 10,
  healthyNetMargin: 15,
  lowRoas: 2,
  highAdsPerUnitRatio: 0.35,
} as const;

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Vista general del negocio y alertas",
  },
  {
    href: "/registro",
    label: "Registro diario",
    icon: ClipboardPenLine,
    description: "Captura y edición del proceso de cálculo",
  },
  {
    href: "/productos",
    label: "Productos",
    icon: Package,
    description: "Configuración y costos predefinidos",
  },
  {
    href: "/historial",
    label: "Historial",
    icon: Table2,
    description: "Tabla, filtros y exportación",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Tendencias, comparativas y rentabilidad",
  },
];
