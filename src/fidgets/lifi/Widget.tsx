"use client";

import type { WidgetConfig } from "@lifi/widget";
import { LiFiWidget, WidgetSkeleton } from "@lifi/widget";
import { ClientOnly } from "./ClientOnly";

export function Widget({
  background,
  fontFamily,
  components,
  fontColor,
  secondaryColor,
}: {
  background: string;
  fontFamily: string;
  components: string;
  fontColor: string;
  secondaryColor: string;
}) {
  const config = {
    fromChain: 8453,
    fromAmount: 420,
    fromToken: "0x0a93a7BE7e7e426fC046e204C44d6b03A302b631",
    theme: {
      typography: {
        fontFamily: fontFamily,
        body1: {
          color: fontColor,
        },
        body2: {
          color: secondaryColor,
        },
      },
      palette: {
        primary: { main: components },
        secondary: { main: "#F5B5FF" },
        background: {
          default: background,
          paper: background,
        },
        text: {
          primary: fontColor,
          secondary: secondaryColor,
        },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: components,
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              backgroundColor: components,
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            root: {
              backgroundColor: components,
            },
          },
        },
        MuiInputCard: {
          styleOverrides: {
            root: {
              backgroundColor: components,
            },
          },
        },
        MuiCardHeader: {
          styleOverrides: {
            subheader: {
              color: secondaryColor,
            },
          },
        },

        MuiTypography: {
          styleOverrides: {
            root: {
              color: fontColor,
            },
          },
        },
      },
    },
  } as Partial<WidgetConfig>;

  return (
    <div>
      <ClientOnly fallback={<WidgetSkeleton config={config} />}>
        <LiFiWidget config={config} integrator="nounspace" />
      </ClientOnly>
    </div>
  );
}
