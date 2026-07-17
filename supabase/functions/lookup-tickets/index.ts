import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const operationNumber = url.searchParams.get("operation_number");

    if (!email && !operationNumber) {
      return new Response(
        JSON.stringify({ error: "Se requiere email o número de operación" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let query = supabase
      .from("tickets")
      .select(`
        id,
        name,
        email,
        phone,
        payment_method,
        operation_number,
        status,
        qr_code,
        is_used,
        created_at,
        events (
          id,
          title,
          event_date,
          price
        )
      `)
      .eq("status", "approved");

    if (email) {
      query = query.eq("email", email.toLowerCase().trim());
    } else if (operationNumber) {
      query = query.eq("operation_number", operationNumber.trim());
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Error al buscar entradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ tickets: data || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
