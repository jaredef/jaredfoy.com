export interface PropDeclaration {
  default: unknown;
  required: boolean;
}

export class PropsParser {
  extract(template: string): {
    template: string;
    props: Record<string, PropDeclaration>;
  } {
    const match = template.match(/<htx:props>\s*(.*?)\s*<\/htx:props>/s);
    if (!match) {
      return { template, props: {} };
    }

    const props = this.parseDeclarations(match[1]);
    let cleanTemplate = template.replace(/<htx:props>\s*.*?\s*<\/htx:props>/s, "");
    cleanTemplate = cleanTemplate.replace(/^\n/, "");

    return {
      template: cleanTemplate,
      props,
    };
  }

  validate(
    callerProps: Record<string, unknown>,
    declarations: Record<string, PropDeclaration>,
    componentSrc: string,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    for (const [name, declaration] of Object.entries(declarations)) {
      if (Object.prototype.hasOwnProperty.call(callerProps, name)) {
        merged[name] = callerProps[name];
      } else if (declaration.required) {
        throw new Error(`Component ${componentSrc} requires prop "${name}" but it was not provided`);
      } else {
        merged[name] = declaration.default;
      }
    }

    for (const [name, value] of Object.entries(callerProps)) {
      if (!Object.prototype.hasOwnProperty.call(merged, name)) {
        merged[name] = value;
      }
    }

    return merged;
  }

  private parseDeclarations(block: string): Record<string, PropDeclaration> {
    const props: Record<string, PropDeclaration> = {};
    const lines = block.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "" || line.startsWith("#") || line.startsWith("//")) {
        continue;
      }

      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) {
        const requiredMatch = line.match(/^(\w+)$/);
        if (requiredMatch) {
          props[requiredMatch[1]] = { default: null, required: true };
        }
        continue;
      }

      const name = line.slice(0, equalsIndex).trim();
      const value = line.slice(equalsIndex + 1).trim();

      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
        props[name] = {
          default: value.slice(1, -1),
          required: false,
        };
        continue;
      }

      if (/^(true|false)$/i.test(value)) {
        props[name] = {
          default: value.toLowerCase() === "true",
          required: false,
        };
        continue;
      }

      if (/^\d+(?:\.\d+)?$/.test(value)) {
        props[name] = {
          default: Number(value),
          required: false,
        };
      }
    }

    return props;
  }
}
