"use client";
import React, { useEffect } from "react";
import TextInput from "@/common/components/molecules/TextInput";
import {
  FidgetArgs,
  FidgetProperties,
  FidgetModule,
  type FidgetSettingsStyle,
} from "@/common/fidgets";
import { defaultStyleFields } from "@/fidgets/helpers";
import { Widget } from "./Widget";
import { max } from "lodash";
import ColorSelector from "@/common/components/molecules/ColorSelector";
import FontSelector from "@/common/components/molecules/FontSelector";
export type LifiFidgetSettings = {
  text: string;
  background: string;
  components: string;
  fontFamily: string;
  fontColor: string;
  secondaryColor: string;
  headerColor: string;
  message: string;
} & FidgetSettingsStyle;

const lifiProperties: FidgetProperties = {
  fidgetName: "lifi",
  icon: 0x1f501,
  fields: [
    {
      fieldName: "message",
      default: "",
      required: true,
      inputSelector: TextInput,
      group: "settings",
    },
    {
      fieldName: "background",
      default: "",
      required: false,
      inputSelector: ColorSelector,
      group: "style",
    },
    {
      fieldName: "components",
      default: "",
      required: false,
      inputSelector: ColorSelector,
      group: "style",
    },
    {
      fieldName: "fontFamily",
      default: "Londrina Solid",
      required: false,
      inputSelector: FontSelector,
      group: "style",
    },
    {
      fieldName: "fontColor",
      default: "",
      required: false,
      inputSelector: ColorSelector,
      group: "style",
    },
    {
      fieldName: "secondaryColor",
      default: "",
      required: false,
      inputSelector: ColorSelector,
      group: "style",
    },
  ],
  size: {
    minHeight: 4,
    maxHeight: 36,
    minWidth: 6,
    maxWidth: 36,
  },
};

function resolveCssVariable(variable) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(variable) ||
    "#000000"
  ); // Default to black if unresolved
}

const Lifi: React.FC<FidgetArgs<LifiFidgetSettings>> = ({ settings }) => {
  const background = settings.background?.startsWith("var")
    ? resolveCssVariable(settings.background)
    : settings.background || resolveCssVariable("");

  const components = settings.components?.startsWith("var")
    ? resolveCssVariable(settings.components)
    : settings.components || resolveCssVariable("");

  const fontFamily = settings.fontFamily || "Londrina Solid";
  const fontColor =
    settings.fontColor || resolveCssVariable("--user-theme-font-color");
  const secondaryColor =
    settings.secondaryColor ||
    resolveCssVariable("--user-theme-secondary-color");
  return (
    <div>
      <Widget
        background={background}
        fontFamily={fontFamily}
        components={components}
        fontColor={fontColor}
        secondaryColor={secondaryColor}
      />
      <p style={{ marginLeft: "20px" }}>{settings.message}</p>
    </div>
  );
};

export default {
  fidget: Lifi,
  properties: lifiProperties,
} as FidgetModule<FidgetArgs<LifiFidgetSettings>>;
