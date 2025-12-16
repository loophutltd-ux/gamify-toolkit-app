import { useEffect, useState, useRef, useCallback } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Input element types
interface InputElement {
  id: string;
  type: "joystick" | "button";
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of screen width
  height: number; // percentage of screen height
  keyBindings: string[]; // e.g., ["w", "a", "s", "d"] for joystick or ["space"] for button
  label?: string;
  showLabel: boolean;
  icon?: string; // custom icon URL
  defaultColor: string;
  hoverColor: string;
  pressColor: string;
  opacity: number;
  borderRadius: number;
  joystickMode?: "wasd" | "arrows" | "custom"; // for joystick type
}

interface InputLayout {
  id: string;
  name: string;
  description: string | null;
  elements: InputElement[];
  isDefault: boolean;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const layouts = await prisma.inputLayout.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Parse the JSON elements field
  const parsedLayouts: InputLayout[] = layouts.map((layout) => ({
    ...layout,
    elements: JSON.parse(layout.elements) as InputElement[],
  }));

  return { layouts: parsedLayouts };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    await prisma.inputLayout.delete({
      where: { id, shop: session.shop },
    });
    return { success: true, action: "deleted" };
  }

  if (actionType === "create" || actionType === "update") {
    const layoutData = {
      shop: session.shop,
      name: formData.get("name") as string,
      description: formData.get("description") as string || "",
      elements: formData.get("elements") as string, // JSON string
      isDefault: formData.get("isDefault") === "true",
    };

    if (actionType === "create") {
      // If setting as default, unset other defaults
      if (layoutData.isDefault) {
        await prisma.inputLayout.updateMany({
          where: { shop: session.shop },
          data: { isDefault: false },
        });
      }

      const layout = await prisma.inputLayout.create({
        data: layoutData,
      });

      return { success: true, action: "created", layout };
    } else {
      const id = formData.get("id") as string;
      
      // If setting as default, unset other defaults
      if (layoutData.isDefault) {
        await prisma.inputLayout.updateMany({
          where: { shop: session.shop, NOT: { id } },
          data: { isDefault: false },
        });
      }

      const layout = await prisma.inputLayout.update({
        where: { id, shop: session.shop },
        data: layoutData,
      });

      return { success: true, action: "updated", layout };
    }
  }

  if (actionType === "setDefault") {
    const id = formData.get("id") as string;
    
    await prisma.inputLayout.updateMany({
      where: { shop: session.shop },
      data: { isDefault: false },
    });
    
    await prisma.inputLayout.update({
      where: { id, shop: session.shop },
      data: { isDefault: true },
    });

    return { success: true, action: "setDefault" };
  }

  return { success: false };
};

// Default element templates
const defaultJoystick: Omit<InputElement, "id"> = {
  type: "joystick",
  x: 5,
  y: 50,
  width: 25,
  height: 25,
  keyBindings: ["w", "a", "s", "d"],
  showLabel: false,
  defaultColor: "#ffffff",
  hoverColor: "#e0e0e0",
  pressColor: "#cccccc",
  opacity: 0.5,
  borderRadius: 50,
  joystickMode: "wasd",
};

const defaultButton: Omit<InputElement, "id"> = {
  type: "button",
  x: 80,
  y: 70,
  width: 15,
  height: 15,
  keyBindings: ["space"],
  label: "A",
  showLabel: true,
  defaultColor: "#ffffff",
  hoverColor: "#e0e0e0",
  pressColor: "#cccccc",
  opacity: 0.5,
  borderRadius: 50,
};

export default function InputLayoutsIndex() {
  const { layouts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [showEditor, setShowEditor] = useState(false);
  const [editingLayout, setEditingLayout] = useState<InputLayout | null>(null);
  const [layoutName, setLayoutName] = useState("");
  const [layoutDescription, setLayoutDescription] = useState("");
  const [elements, setElements] = useState<InputElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const updateElement = useCallback((id: string, updates: Partial<InputElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  useEffect(() => {
    if (fetcher.data?.success && (fetcher.data.action === "created" || fetcher.data.action === "updated")) {
      setShowEditor(false);
      resetEditor();
    }
  }, [fetcher.data]);

  const resetEditor = () => {
    setEditingLayout(null);
    setLayoutName("");
    setLayoutDescription("");
    setElements([]);
    setSelectedElement(null);
    setIsDefault(false);
  };

  const openEditor = (layout?: InputLayout) => {
    if (layout) {
      setEditingLayout(layout);
      setLayoutName(layout.name);
      setLayoutDescription(layout.description || "");
      setElements(layout.elements);
      setIsDefault(layout.isDefault);
    } else {
      resetEditor();
    }
    setShowEditor(true);
  };

  const addElement = (type: "joystick" | "button") => {
    const newElement: InputElement = {
      ...(type === "joystick" ? defaultJoystick : defaultButton),
      id: `element-${Date.now()}`,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const elementX = (element.x / 100) * rect.width;
    const elementY = (element.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    });
    setIsDragging(true);
    setSelectedElement(elementId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    updateElement(selectedElement, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, [isDragging, selectedElement, dragOffset, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("action", editingLayout ? "update" : "create");
    if (editingLayout) {
      submitData.append("id", editingLayout.id);
    }
    submitData.append("name", layoutName);
    submitData.append("description", layoutDescription);
    submitData.append("elements", JSON.stringify(elements));
    submitData.append("isDefault", isDefault.toString());
    fetcher.submit(submitData, { method: "POST" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this input layout?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", id);
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const handleSetDefault = (id: string) => {
    const formData = new FormData();
    formData.append("action", "setDefault");
    formData.append("id", id);
    fetcher.submit(formData, { method: "POST" });
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <s-page heading="Mobile Input Layouts">
      <s-button 
        slot="primary-action" 
        onClick={() => showEditor ? (setShowEditor(false), resetEditor()) : openEditor()}
      >
        {showEditor ? "Cancel" : "Create New Layout"}
      </s-button>

      {showEditor && (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-heading>{editingLayout ? "Edit Layout" : "Create New Layout"}</s-heading>
            
            <form onSubmit={handleSubmit}>
              <s-stack direction="block" gap="base">
                <s-text-field
                  label="Layout Name"
                  value={layoutName}
                  onChange={(e: any) => setLayoutName(e.target.value)}
                  required
                />
                
                <s-text-field
                  label="Description"
                  value={layoutDescription}
                  onChange={(e: any) => setLayoutDescription(e.target.value)}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input 
                    type="checkbox" 
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <label htmlFor="isDefault">Set as default layout</label>
                </div>

                {/* Element Toolbar */}
                <s-stack direction="inline" gap="base">
                  <s-button variant="secondary" onClick={() => addElement("joystick")} type="button">
                    + Add Joystick
                  </s-button>
                  <s-button variant="secondary" onClick={() => addElement("button")} type="button">
                    + Add Button
                  </s-button>
                </s-stack>

                {/* Preview Area - Phone mockup */}
                <div style={{ 
                  display: "flex", 
                  gap: "24px", 
                  alignItems: "flex-start",
                  flexWrap: "wrap" 
                }}>
                  {/* Phone Preview */}
                  <div style={{
                    width: "280px",
                    height: "560px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "30px",
                    padding: "10px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    flexShrink: 0,
                  }}>
                    <div 
                      ref={previewRef}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#2d2d2d",
                        borderRadius: "20px",
                        position: "relative",
                        overflow: "hidden",
                        backgroundImage: "linear-gradient(45deg, #3a3a3a 25%, transparent 25%), linear-gradient(-45deg, #3a3a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3a 75%), linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#666",
                        fontSize: "12px",
                        textAlign: "center",
                        pointerEvents: "none",
                      }}>
                        Game Preview Area
                      </div>
                      
                      {/* Render Elements */}
                      {elements.map(element => (
                        <div
                          key={element.id}
                          role="button"
                          tabIndex={0}
                          onMouseDown={(e) => handleMouseDown(e, element.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedElement(element.id);
                            }
                          }}
                          style={{
                            position: "absolute",
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            width: `${element.width}%`,
                            height: `${element.height}%`,
                            backgroundColor: element.defaultColor,
                            opacity: element.opacity,
                            borderRadius: element.type === "joystick" ? "50%" : `${element.borderRadius}%`,
                            border: selectedElement === element.id ? "2px solid #007bff" : "2px solid transparent",
                            cursor: "move",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            userSelect: "none",
                          }}
                        >
                          {element.type === "joystick" ? (
                            <div style={{
                              width: "40%",
                              height: "40%",
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderRadius: "50%",
                            }} />
                          ) : element.showLabel && element.label ? (
                            <span style={{ 
                              color: "#333", 
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}>
                              {element.label}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Element Properties Panel */}
                  {selectedEl && (
                    <div style={{
                      flex: 1,
                      minWidth: "300px",
                      padding: "16px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "8px",
                    }}>
                      <s-stack direction="block" gap="base">
                        <s-heading>
                          {selectedEl.type === "joystick" ? "Joystick" : "Button"} Properties
                        </s-heading>

                        {selectedEl.type === "joystick" && (
                          <div>
                            <label htmlFor="joystickMode" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Joystick Mode</label>
                            <select
                              id="joystickMode"
                              value={selectedEl.joystickMode || "wasd"}
                              onChange={(e) => {
                                const mode = e.target.value as "wasd" | "arrows" | "custom";
                                let bindings: string[] = [];
                                if (mode === "wasd") bindings = ["w", "a", "s", "d"];
                                else if (mode === "arrows") bindings = ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];
                                updateElement(selectedEl.id, { joystickMode: mode, keyBindings: bindings });
                              }}
                              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                            >
                              <option value="wasd">WASD Keys</option>
                              <option value="arrows">Arrow Keys</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        )}

                        {selectedEl.type === "button" && (
                          <>
                            <s-text-field
                              label="Key Binding"
                              value={selectedEl.keyBindings[0] || ""}
                              onChange={(e: any) => updateElement(selectedEl.id, { keyBindings: [e.target.value] })}
                            />
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input 
                                type="checkbox" 
                                id="showLabel"
                                checked={selectedEl.showLabel}
                                onChange={(e) => updateElement(selectedEl.id, { showLabel: e.target.checked })}
                              />
                              <label htmlFor="showLabel">Show Label</label>
                            </div>

                            {selectedEl.showLabel && (
                              <s-text-field
                                label="Button Label"
                                value={selectedEl.label || ""}
                                onChange={(e: any) => updateElement(selectedEl.id, { label: e.target.value })}
                              />
                            )}
                          </>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <div style={{ flex: 1 }}>
                            <label htmlFor="elementWidth" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Width (%)</label>
                            <input
                              id="elementWidth"
                              type="number"
                              value={selectedEl.width}
                              onChange={(e) => updateElement(selectedEl.id, { width: parseFloat(e.target.value) || 10 })}
                              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label htmlFor="elementHeight" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Height (%)</label>
                            <input
                              id="elementHeight"
                              type="number"
                              value={selectedEl.height}
                              onChange={(e) => updateElement(selectedEl.id, { height: parseFloat(e.target.value) || 10 })}
                              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="opacity" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Opacity (0 to 1)</label>
                          <input
                            id="opacity"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={selectedEl.opacity}
                            onChange={(e) => updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) || 0.5 })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          <div>
                            <label htmlFor="defaultColor" style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Default Color</label>
                            <input
                              id="defaultColor"
                              type="color"
                              value={selectedEl.defaultColor}
                              onChange={(e) => updateElement(selectedEl.id, { defaultColor: e.target.value })}
                              style={{ width: "60px", height: "30px" }}
                            />
                          </div>
                          <div>
                            <label htmlFor="hoverColor" style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Hover Color</label>
                            <input
                              id="hoverColor"
                              type="color"
                              value={selectedEl.hoverColor}
                              onChange={(e) => updateElement(selectedEl.id, { hoverColor: e.target.value })}
                              style={{ width: "60px", height: "30px" }}
                            />
                          </div>
                          <div>
                            <label htmlFor="pressColor" style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Press Color</label>
                            <input
                              id="pressColor"
                              type="color"
                              value={selectedEl.pressColor}
                              onChange={(e) => updateElement(selectedEl.id, { pressColor: e.target.value })}
                              style={{ width: "60px", height: "30px" }}
                            />
                          </div>
                        </div>

                        <s-text-field
                          label="Custom Icon URL (optional)"
                          value={selectedEl.icon || ""}
                          onChange={(e: any) => updateElement(selectedEl.id, { icon: e.target.value })}
                        />

                        <s-button 
                          variant="primary"
                          tone="critical"
                          onClick={() => deleteElement(selectedEl.id)}
                          type="button"
                        >
                          Delete Element
                        </s-button>
                      </s-stack>
                    </div>
                  )}
                </div>

                {/* Element List */}
                {elements.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <s-text><strong>Elements ({elements.length})</strong></s-text>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      {elements.map((el, index) => (
                        <s-button
                          key={el.id}
                          variant={selectedElement === el.id ? "primary" : "secondary"}
                          onClick={() => setSelectedElement(el.id)}
                          type="button"
                        >
                          {el.type === "joystick" ? "🕹️" : "⏺️"} {el.type} {index + 1}
                        </s-button>
                      ))}
                    </div>
                  </div>
                )}

                <s-stack direction="inline" gap="base">
                  <s-button 
                    type="submit"
                    {...(fetcher.state === "submitting" ? { loading: true } : {})}
                  >
                    {editingLayout ? "Update Layout" : "Create Layout"}
                  </s-button>
                  <s-button variant="tertiary" onClick={() => { setShowEditor(false); resetEditor(); }} type="button">
                    Cancel
                  </s-button>
                </s-stack>
              </s-stack>
            </form>
          </s-stack>
        </s-section>
      )}

      {/* Existing Layouts List */}
      <s-section heading="Your Input Layouts">
        {layouts.length === 0 ? (
          <s-paragraph>
            No input layouts yet. Create your first layout to add mobile touch controls to your games!
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {layouts.map((layout) => (
              <s-box
                key={layout.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base">
                    <s-heading>{layout.name}</s-heading>
                    {layout.isDefault && (
                      <s-badge tone="success">Default</s-badge>
                    )}
                  </s-stack>
                  
                  {layout.description && (
                    <s-paragraph>{layout.description}</s-paragraph>
                  )}
                  
                  <s-text>
                    {layout.elements.length} element{layout.elements.length !== 1 ? "s" : ""}: 
                    {" "}{layout.elements.filter(e => e.type === "joystick").length} joystick(s), 
                    {" "}{layout.elements.filter(e => e.type === "button").length} button(s)
                  </s-text>

                  <s-stack direction="inline" gap="base">
                    <s-button variant="secondary" onClick={() => openEditor(layout)}>
                      Edit
                    </s-button>
                    {!layout.isDefault && (
                      <s-button variant="secondary" onClick={() => handleSetDefault(layout.id)}>
                        Set as Default
                      </s-button>
                    )}
                    <s-button variant="primary" tone="critical" onClick={() => handleDelete(layout.id)}>
                      Delete
                    </s-button>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      {/* Usage Instructions */}
      <s-section slot="aside" heading="How to Use">
        <s-unordered-list>
          <s-list-item>
            Create an input layout by adding joysticks and buttons
          </s-list-item>
          <s-list-item>
            Drag elements to position them on the preview screen
          </s-list-item>
          <s-list-item>
            Configure key bindings, colors, and appearance for each element
          </s-list-item>
          <s-list-item>
            Set a layout as default, or select a specific layout in the WebGL Game block settings
          </s-list-item>
          <s-list-item>
            The touch controls will automatically appear when mobile users enter fullscreen mode
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Joystick Modes">
        <s-paragraph>
          <strong>WASD:</strong> Maps to W (up), A (left), S (down), D (right) keys
        </s-paragraph>
        <s-paragraph>
          <strong>Arrows:</strong> Maps to Arrow keys for movement
        </s-paragraph>
        <s-paragraph>
          <strong>Custom:</strong> Define your own key bindings
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
