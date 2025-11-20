import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority, TeamMemberName } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Return Partial Task because projectId will be assigned by the component
export const generateTasksFromIdea = async (idea: string): Promise<Omit<Task, 'id' | 'createdAt' | 'status' | 'projectId'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Genera de 3 a 5 tareas accionables para un tablero Kanban basadas en esta idea o tema: "${idea}". 
      
      Asigna cada tarea inteligentemente a uno de los siguientes miembros del equipo según la naturaleza de la tarea:
      - Dairo (CEO): Estrategia, Negocios, Gestión.
      - Stiven (Dev): Desarrollo, Código, Bases de datos, API.
      - Mariana (Designer): UI/UX, Gráficos, Branding, Estilos.
      - Jose (Freelancer): Tareas de soporte, redacción o extras.
      - Anderson (Freelancer): Tareas de soporte o extras.

      Asegúrate de que las tareas varíen en prioridad. Mantén las descripciones concisas. Responde siempre en Español.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
              assignee: { type: Type.STRING, enum: ["Dairo", "Stiven", "Mariana", "Jose", "Anderson"] }
            },
            required: ["title", "description", "priority", "assignee"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    
    return parsed.map((item: any) => ({
        title: item.title,
        description: item.description,
        priority: item.priority as Priority,
        assignee: item.assignee as TeamMemberName,
        creator: 'Dairo' as TeamMemberName, // Default creator for AI generated tasks
    }));

  } catch (error) {
    console.error("Failed to generate tasks:", error);
    throw error;
  }
};