/**
 * Pre-built BOQ template seeds for common construction categories
 */

export const TEMPLATE_SEEDS = [
  {
    name: "Concrete Works",
    description: "Standard concrete work items including foundations, slabs, and structures",
    category: "Concrete",
    items: [
      { itemCode: "CON-001", description: "Concrete Foundation (M25)", unit: "m³", quantity: 50, unitPrice: 5000, category: "Concrete", wbsCode: "1.1" },
      { itemCode: "CON-002", description: "Concrete Floor Slab (M20)", unit: "m³", quantity: 100, unitPrice: 4500, category: "Concrete", wbsCode: "1.2" },
      { itemCode: "CON-003", description: "Concrete Columns (M30)", unit: "m³", quantity: 30, unitPrice: 6000, category: "Concrete", wbsCode: "1.3" },
      { itemCode: "CON-004", description: "Concrete Beams (M25)", unit: "m³", quantity: 40, unitPrice: 5500, category: "Concrete", wbsCode: "1.4" },
      { itemCode: "CON-005", description: "Concrete Finish (Polished)", unit: "m²", quantity: 500, unitPrice: 200, category: "Concrete", wbsCode: "1.5" },
    ]
  },
  {
    name: "Steel Reinforcement",
    description: "Steel reinforcement and structural steel items",
    category: "Steel",
    items: [
      { itemCode: "STL-001", description: "Steel Reinforcement Bar (16mm)", unit: "ton", quantity: 50, unitPrice: 45000, category: "Steel", wbsCode: "2.1" },
      { itemCode: "STL-002", description: "Steel Reinforcement Bar (12mm)", unit: "ton", quantity: 40, unitPrice: 42000, category: "Steel", wbsCode: "2.2" },
      { itemCode: "STL-003", description: "Steel Reinforcement Bar (8mm)", unit: "ton", quantity: 30, unitPrice: 40000, category: "Steel", wbsCode: "2.3" },
      { itemCode: "STL-004", description: "Structural Steel Columns (ISMB)", unit: "ton", quantity: 25, unitPrice: 55000, category: "Steel", wbsCode: "2.4" },
      { itemCode: "STL-005", description: "Steel Mesh (6mm)", unit: "m²", quantity: 1000, unitPrice: 150, category: "Steel", wbsCode: "2.5" },
    ]
  },
  {
    name: "Brickwork & Masonry",
    description: "Brickwork, masonry, and wall construction items",
    category: "Masonry",
    items: [
      { itemCode: "BRK-001", description: "Brickwork (9\" thick)", unit: "m²", quantity: 2000, unitPrice: 500, category: "Masonry", wbsCode: "3.1" },
      { itemCode: "BRK-002", description: "Brickwork (4.5\" thick)", unit: "m²", quantity: 1500, unitPrice: 350, category: "Masonry", wbsCode: "3.2" },
      { itemCode: "BRK-003", description: "Cement Mortar (1:4)", unit: "m³", quantity: 100, unitPrice: 3000, category: "Masonry", wbsCode: "3.3" },
      { itemCode: "BRK-004", description: "Stone Masonry", unit: "m²", quantity: 500, unitPrice: 800, category: "Masonry", wbsCode: "3.4" },
      { itemCode: "BRK-005", description: "Plaster (12mm)", unit: "m²", quantity: 3000, unitPrice: 150, category: "Masonry", wbsCode: "3.5" },
    ]
  },
  {
    name: "Labor & Manpower",
    description: "Labor costs for various construction activities",
    category: "Labor",
    items: [
      { itemCode: "LAB-001", description: "Skilled Labor (Foreman)", unit: "day", quantity: 200, unitPrice: 1500, category: "Labor", wbsCode: "4.1" },
      { itemCode: "LAB-002", description: "Semi-Skilled Labor (Mason)", unit: "day", quantity: 500, unitPrice: 800, category: "Labor", wbsCode: "4.2" },
      { itemCode: "LAB-003", description: "Unskilled Labor (Helper)", unit: "day", quantity: 1000, unitPrice: 400, category: "Labor", wbsCode: "4.3" },
      { itemCode: "LAB-004", description: "Safety Personnel", unit: "day", quantity: 150, unitPrice: 600, category: "Labor", wbsCode: "4.4" },
      { itemCode: "LAB-005", description: "Supervision & Inspection", unit: "day", quantity: 200, unitPrice: 2000, category: "Labor", wbsCode: "4.5" },
    ]
  },
  {
    name: "Equipment & Machinery",
    description: "Equipment rental and machinery costs",
    category: "Equipment",
    items: [
      { itemCode: "EQP-001", description: "Excavator Rental (per day)", unit: "day", quantity: 100, unitPrice: 5000, category: "Equipment", wbsCode: "5.1" },
      { itemCode: "EQP-002", description: "Concrete Mixer Rental (per day)", unit: "day", quantity: 200, unitPrice: 2000, category: "Equipment", wbsCode: "5.2" },
      { itemCode: "EQP-003", description: "Crane Rental (per day)", unit: "day", quantity: 50, unitPrice: 8000, category: "Equipment", wbsCode: "5.3" },
      { itemCode: "EQP-004", description: "Scaffolding (per m²)", unit: "m²", quantity: 5000, unitPrice: 100, category: "Equipment", wbsCode: "5.4" },
      { itemCode: "EQP-005", description: "Power Tools & Equipment", unit: "month", quantity: 6, unitPrice: 3000, category: "Equipment", wbsCode: "5.5" },
    ]
  },
  {
    name: "Finishing & Painting",
    description: "Interior and exterior finishing, painting, and decoration",
    category: "Finishing",
    items: [
      { itemCode: "FIN-001", description: "Interior Paint (per m²)", unit: "m²", quantity: 3000, unitPrice: 80, category: "Finishing", wbsCode: "6.1" },
      { itemCode: "FIN-002", description: "Exterior Paint (per m²)", unit: "m²", quantity: 2000, unitPrice: 120, category: "Finishing", wbsCode: "6.2" },
      { itemCode: "FIN-003", description: "Ceramic Tiles (per m²)", unit: "m²", quantity: 1000, unitPrice: 400, category: "Finishing", wbsCode: "6.3" },
      { itemCode: "FIN-004", description: "Wooden Flooring (per m²)", unit: "m²", quantity: 500, unitPrice: 800, category: "Finishing", wbsCode: "6.4" },
      { itemCode: "FIN-005", description: "Wallpaper & Decoration", unit: "m²", quantity: 800, unitPrice: 200, category: "Finishing", wbsCode: "6.5" },
    ]
  },
  {
    name: "Plumbing & Sanitation",
    description: "Plumbing fixtures, pipes, and sanitation items",
    category: "Plumbing",
    items: [
      { itemCode: "PLM-001", description: "PVC Pipes (50mm)", unit: "m", quantity: 500, unitPrice: 150, category: "Plumbing", wbsCode: "7.1" },
      { itemCode: "PLM-002", description: "PVC Pipes (32mm)", unit: "m", quantity: 800, unitPrice: 100, category: "Plumbing", wbsCode: "7.2" },
      { itemCode: "PLM-003", description: "Water Tank (1000L)", unit: "unit", quantity: 5, unitPrice: 15000, category: "Plumbing", wbsCode: "7.3" },
      { itemCode: "PLM-004", description: "Sanitary Fixtures (Toilet Set)", unit: "unit", quantity: 20, unitPrice: 8000, category: "Plumbing", wbsCode: "7.4" },
      { itemCode: "PLM-005", description: "Taps & Fittings", unit: "unit", quantity: 50, unitPrice: 1000, category: "Plumbing", wbsCode: "7.5" },
    ]
  },
  {
    name: "Electrical Works",
    description: "Electrical installation, wiring, and fixtures",
    category: "Electrical",
    items: [
      { itemCode: "ELC-001", description: "Electrical Wiring (2.5mm)", unit: "m", quantity: 5000, unitPrice: 50, category: "Electrical", wbsCode: "8.1" },
      { itemCode: "ELC-002", description: "Electrical Wiring (1.5mm)", unit: "m", quantity: 8000, unitPrice: 35, category: "Electrical", wbsCode: "8.2" },
      { itemCode: "ELC-003", description: "Light Fixtures (LED)", unit: "unit", quantity: 100, unitPrice: 2000, category: "Electrical", wbsCode: "8.3" },
      { itemCode: "ELC-004", description: "Electrical Switchboard", unit: "unit", quantity: 10, unitPrice: 25000, category: "Electrical", wbsCode: "8.4" },
      { itemCode: "ELC-005", description: "Power Outlets & Switches", unit: "unit", quantity: 200, unitPrice: 500, category: "Electrical", wbsCode: "8.5" },
    ]
  },
  {
    name: "HVAC Systems",
    description: "Heating, ventilation, and air conditioning systems",
    category: "HVAC",
    items: [
      { itemCode: "HVC-001", description: "Air Conditioning Unit (1.5 Ton)", unit: "unit", quantity: 10, unitPrice: 35000, category: "HVAC", wbsCode: "9.1" },
      { itemCode: "HVC-002", description: "Air Conditioning Unit (2 Ton)", unit: "unit", quantity: 15, unitPrice: 45000, category: "HVAC", wbsCode: "9.2" },
      { itemCode: "HVC-003", description: "Ductwork Installation", unit: "m", quantity: 500, unitPrice: 500, category: "HVAC", wbsCode: "9.3" },
      { itemCode: "HVC-004", description: "Ventilation Fan", unit: "unit", quantity: 30, unitPrice: 5000, category: "HVAC", wbsCode: "9.4" },
      { itemCode: "HVC-005", description: "Thermostat & Controls", unit: "unit", quantity: 20, unitPrice: 3000, category: "HVAC", wbsCode: "9.5" },
    ]
  },
  {
    name: "Roofing & Waterproofing",
    description: "Roofing materials and waterproofing solutions",
    category: "Roofing",
    items: [
      { itemCode: "ROF-001", description: "Concrete Roof Slab (M20)", unit: "m³", quantity: 80, unitPrice: 4500, category: "Roofing", wbsCode: "10.1" },
      { itemCode: "ROF-002", description: "Roof Tiles (per m²)", unit: "m²", quantity: 1000, unitPrice: 300, category: "Roofing", wbsCode: "10.2" },
      { itemCode: "ROF-003", description: "Waterproofing Membrane", unit: "m²", quantity: 1500, unitPrice: 200, category: "Roofing", wbsCode: "10.3" },
      { itemCode: "ROF-004", description: "Metal Roofing Sheet", unit: "m²", quantity: 500, unitPrice: 400, category: "Roofing", wbsCode: "10.4" },
      { itemCode: "ROF-005", description: "Roof Insulation", unit: "m²", quantity: 800, unitPrice: 150, category: "Roofing", wbsCode: "10.5" },
    ]
  },
];

export const TEMPLATE_CATEGORIES = [
  "Concrete",
  "Steel",
  "Masonry",
  "Labor",
  "Equipment",
  "Finishing",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
];
