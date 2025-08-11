import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const Noir = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "{zinc.50}",
          100: "{zinc.100}",
          200: "{zinc.200}",
          300: "{zinc.300}",
          400: "{zinc.400}",
          500: "{zinc.500}",
          600: "{zinc.600}",
          700: "{zinc.700}",
          800: "{zinc.800}",
          900: "{zinc.900}",
          950: "{zinc.950}",
        },
        background: "{surface.100}",
        primary: {
          color: "{green.900}",
          inverseColor: "#ffffff",
          hoverColor: "{green.800}",
          activeColor: "{green.700}",
        },
        highlight: {
          background: "{green.950}",
          focusBackground: "{green.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
      dark: {
        surface: {
          0: "#ffffff",
          50: "{slate.50}",
          100: "{slate.100}",
          200: "{slate.200}",
          300: "{slate.300}",
          400: "{slate.400}",
          500: "{slate.500}",
          600: "{slate.600}",
          700: "{slate.700}",
          800: "{slate.800}",
          900: "{slate.900}",
          950: "{slate.950}",
        },
        background: "{surface.800}",
        primary: {
          color: "{green.500}",
          inverseColor: "{zinc.950}",
          hoverColor: "{green.300}",
          activeColor: "{green.200}",
        },
        highlight: {
          background: "{green.950}",
          focusBackground: "{green.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
    },
  },
});
