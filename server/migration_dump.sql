--
-- PostgreSQL database dump
--

\restrict aivSU1kgeCyvYw4OsEQs5VlxfkdzumGXWoy68HZRcVHvVh3H57dZOsXYJRuYnYo

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: estado_factura; Type: TYPE; Schema: public; Owner: iprieto
--

CREATE TYPE public.estado_factura AS ENUM (
    'BORRADOR',
    'EMITIDA',
    'ENVIADA',
    'FIRMADA',
    'REGISTRADA',
    'RECHAZADA',
    'PAGADA',
    'CANCELADA'
);


ALTER TYPE public.estado_factura OWNER TO iprieto;

--
-- Name: metodo_pago_enum; Type: TYPE; Schema: public; Owner: iprieto
--

CREATE TYPE public.metodo_pago_enum AS ENUM (
    'TRANSFERENCIA',
    'TARJETA',
    'ADEUDO_SEPA',
    'PAYPAL',
    'CONTADO',
    'OTRO'
);


ALTER TYPE public.metodo_pago_enum OWNER TO iprieto;

--
-- Name: calcular_totales_factura(uuid); Type: FUNCTION; Schema: public; Owner: iprieto
--

CREATE FUNCTION public.calcular_totales_factura(p_id_factura uuid) RETURNS TABLE(subtotal numeric, impuestos numeric, total numeric)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY
SELECT COALESCE(SUM((cantidad * precio_unitario)), 0)::NUMERIC(12, 2) AS subtotal,
    COALESCE(SUM(importe_impuesto), 0)::NUMERIC(12, 2) AS impuestos,
    COALESCE(SUM(total_linea), 0)::NUMERIC(12, 2) AS total
FROM linea_factura
WHERE id_factura = p_id_factura;
END;
$$;


ALTER FUNCTION public.calcular_totales_factura(p_id_factura uuid) OWNER TO iprieto;

--
-- Name: FUNCTION calcular_totales_factura(p_id_factura uuid); Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON FUNCTION public.calcular_totales_factura(p_id_factura uuid) IS 'Calculate invoice totals from line items';


--
-- Name: log_factura_estado_change(); Type: FUNCTION; Schema: public; Owner: iprieto
--

CREATE FUNCTION public.log_factura_estado_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF OLD.estado IS DISTINCT
FROM NEW.estado THEN
INSERT INTO log_factura (id_factura, accion, detalle)
VALUES (
        NEW.id_factura,
        'ESTADO_CAMBIADO',
        'Estado cambiado de ' || OLD.estado || ' a ' || NEW.estado
    );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_factura_estado_change() OWNER TO iprieto;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: iprieto
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO iprieto;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adjunto; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.adjunto (
    id_adjunto uuid DEFAULT gen_random_uuid() NOT NULL,
    id_factura uuid NOT NULL,
    filename character varying(255) NOT NULL,
    tipo character varying(50),
    url text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.adjunto OWNER TO iprieto;

--
-- Name: TABLE adjunto; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.adjunto IS 'Files attached to invoices';


--
-- Name: COLUMN adjunto.tipo; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.adjunto.tipo IS 'MIME type (e.g., application/pdf, image/jpeg)';


--
-- Name: COLUMN adjunto.url; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.adjunto.url IS 'File storage URL or path';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(50),
    details jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO iprieto;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO iprieto;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: authorization_objects; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.authorization_objects (
    id integer NOT NULL,
    object_type character varying(50) NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.authorization_objects OWNER TO iprieto;

--
-- Name: authorization_objects_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.authorization_objects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.authorization_objects_id_seq OWNER TO iprieto;

--
-- Name: authorization_objects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.authorization_objects_id_seq OWNED BY public.authorization_objects.id;


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.certificates (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    cn character varying(255),
    created_date timestamp without time zone,
    expiry_date timestamp without time zone,
    chain text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    acronimo character varying(255),
    encrypted_p12 text,
    iv character varying(255)
);


ALTER TABLE public.certificates OWNER TO iprieto;

--
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.certificates_id_seq OWNER TO iprieto;

--
-- Name: certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.certificates_id_seq OWNED BY public.certificates.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.countries OWNER TO iprieto;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.countries_id_seq OWNER TO iprieto;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: documentation_xml; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.documentation_xml (
    id integer NOT NULL,
    nombre_objeto character varying(20) NOT NULL,
    tipo_estructura character varying(10) NOT NULL,
    formato character varying(5) NOT NULL,
    descripcion character varying(120) NOT NULL,
    fields_data jsonb
);


ALTER TABLE public.documentation_xml OWNER TO iprieto;

--
-- Name: documentation_xml_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.documentation_xml_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.documentation_xml_id_seq OWNER TO iprieto;

--
-- Name: documentation_xml_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.documentation_xml_id_seq OWNED BY public.documentation_xml.id;


--
-- Name: emisor; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.emisor (
    id_emisor uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    nif character varying(20) NOT NULL,
    direccion text,
    email character varying(200),
    telefono character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.emisor OWNER TO iprieto;

--
-- Name: TABLE emisor; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.emisor IS 'Invoice issuers (companies/individuals that issue invoices)';


--
-- Name: COLUMN emisor.nif; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.emisor.nif IS 'Tax identification number (unique)';


--
-- Name: factura; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.factura (
    id_factura uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(50) NOT NULL,
    serie character varying(20),
    fecha_emision date NOT NULL,
    fecha_vencimiento date,
    id_emisor uuid NOT NULL,
    id_receptor uuid NOT NULL,
    estado public.estado_factura DEFAULT 'BORRADOR'::public.estado_factura NOT NULL,
    metodo_pago public.metodo_pago_enum,
    subtotal numeric(12,2) NOT NULL,
    impuestos_totales numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    xml_path text,
    pdf_path text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tipo character varying(20) DEFAULT 'ISSUE'::character varying NOT NULL,
    codigo_tipo character varying(2) NOT NULL,
    id_origen integer,
    fecha_operacion date,
    invoice_country_id integer NOT NULL,
    external_process_id character varying(255),
    CONSTRAINT factura_impuestos_totales_check CHECK ((impuestos_totales >= (0)::numeric)),
    CONSTRAINT factura_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT factura_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ISSUE'::character varying, 'RECEIPT'::character varying])::text[]))),
    CONSTRAINT factura_total_check CHECK ((total >= (0)::numeric))
);


ALTER TABLE public.factura OWNER TO iprieto;

--
-- Name: TABLE factura; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.factura IS 'Main invoice table';


--
-- Name: COLUMN factura.numero; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.factura.numero IS 'Invoice number';


--
-- Name: COLUMN factura.serie; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.factura.serie IS 'Invoice series (e.g., A, B, 2024)';


--
-- Name: COLUMN factura.tipo; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.factura.tipo IS 'Type of invoice: ISSUE (emitida) or RECEIPT (recibida)';


--
-- Name: COLUMN factura.codigo_tipo; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.factura.codigo_tipo IS 'Code for invoice type: 01 (Issued/Emitida), 02 (Received/Recibida)';


--
-- Name: COLUMN factura.fecha_operacion; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.factura.fecha_operacion IS 'Date when the operation took place (fecha de devengo)';


--
-- Name: fiscal_models; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.fiscal_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    model_type character varying(50) NOT NULL,
    year integer NOT NULL,
    period character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.fiscal_models OWNER TO iprieto;

--
-- Name: impuesto; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.impuesto (
    id_impuesto uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion character varying(200),
    porcentaje numeric(5,2) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.impuesto OWNER TO iprieto;

--
-- Name: TABLE impuesto; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.impuesto IS 'Tax catalog (VAT, IVA, etc.)';


--
-- Name: COLUMN impuesto.porcentaje; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.impuesto.porcentaje IS 'Tax percentage (e.g., 21.00 for 21%, -15.00 for withholding)';


--
-- Name: invoice_country; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.invoice_country (
    id integer NOT NULL,
    pais character varying(255) NOT NULL,
    region character varying(255)
);


ALTER TABLE public.invoice_country OWNER TO iprieto;

--
-- Name: invoice_country_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.invoice_country_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoice_country_id_seq OWNER TO iprieto;

--
-- Name: invoice_country_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.invoice_country_id_seq OWNED BY public.invoice_country.id;


--
-- Name: linea_factura; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.linea_factura (
    id_linea uuid DEFAULT gen_random_uuid() NOT NULL,
    id_factura uuid NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    porcentaje_impuesto numeric(5,2),
    importe_impuesto numeric(12,2),
    total_linea numeric(12,2) NOT NULL,
    id_impuesto uuid,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT linea_factura_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT linea_factura_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric)),
    CONSTRAINT linea_factura_total_linea_check CHECK ((total_linea >= (0)::numeric))
);


ALTER TABLE public.linea_factura OWNER TO iprieto;

--
-- Name: TABLE linea_factura; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.linea_factura IS 'Invoice line items';


--
-- Name: COLUMN linea_factura.total_linea; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.linea_factura.total_linea IS 'Total for this line (quantity × price + tax)';


--
-- Name: log_factura; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.log_factura (
    id_log uuid DEFAULT gen_random_uuid() NOT NULL,
    id_factura uuid NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    accion character varying(200) NOT NULL,
    detalle text,
    usuario character varying(100)
);


ALTER TABLE public.log_factura OWNER TO iprieto;

--
-- Name: TABLE log_factura; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.log_factura IS 'Audit trail for invoice operations';


--
-- Name: COLUMN log_factura.accion; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON COLUMN public.log_factura.accion IS 'Action performed (e.g., CREADA, MODIFICADA, ESTADO_CAMBIADO)';


--
-- Name: origenes; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.origenes (
    id_origen integer NOT NULL,
    descripcion character varying(255) NOT NULL
);


ALTER TABLE public.origenes OWNER TO iprieto;

--
-- Name: origenes_id_origen_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.origenes_id_origen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.origenes_id_origen_seq OWNER TO iprieto;

--
-- Name: origenes_id_origen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.origenes_id_origen_seq OWNED BY public.origenes.id_origen;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO iprieto;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO iprieto;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.producto (
    id_producto uuid DEFAULT gen_random_uuid() NOT NULL,
    sku character varying(50) NOT NULL,
    tipo character varying(20) NOT NULL,
    precio_base numeric(10,2) NOT NULL,
    id_impuesto uuid,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT producto_precio_base_check CHECK ((precio_base >= (0)::numeric)),
    CONSTRAINT producto_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PRODUCTO'::character varying, 'SERVICIO'::character varying])::text[])))
);


ALTER TABLE public.producto OWNER TO iprieto;

--
-- Name: producto_precio; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.producto_precio (
    id_precio uuid DEFAULT gen_random_uuid() NOT NULL,
    id_producto uuid NOT NULL,
    codigo_pais character varying(2) NOT NULL,
    moneda character varying(3) NOT NULL,
    precio numeric(10,2) NOT NULL,
    CONSTRAINT producto_precio_precio_check CHECK ((precio >= (0)::numeric))
);


ALTER TABLE public.producto_precio OWNER TO iprieto;

--
-- Name: producto_traduccion; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.producto_traduccion (
    id_traduccion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_producto uuid NOT NULL,
    codigo_idioma character varying(5) NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text
);


ALTER TABLE public.producto_traduccion OWNER TO iprieto;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    user_id integer,
    first_name character varying(100),
    last_name character varying(100),
    nif character varying(20),
    phone character varying(50),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state_province character varying(100),
    postal_code character varying(20),
    country character varying(100),
    date_of_birth date,
    bio text,
    avatar_url text
);


ALTER TABLE public.profiles OWNER TO iprieto;

--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profiles_id_seq OWNER TO iprieto;

--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: receptor; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.receptor (
    id_receptor uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    nif character varying(20) NOT NULL,
    direccion text,
    email character varying(200),
    telefono character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.receptor OWNER TO iprieto;

--
-- Name: TABLE receptor; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON TABLE public.receptor IS 'Invoice receivers (customers/clients)';


--
-- Name: rol_profile_auth_objects; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.rol_profile_auth_objects (
    profile_id integer NOT NULL,
    auth_object_id integer NOT NULL
);


ALTER TABLE public.rol_profile_auth_objects OWNER TO iprieto;

--
-- Name: rol_profiles; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.rol_profiles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rol_profiles OWNER TO iprieto;

--
-- Name: rol_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.rol_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rol_profiles_id_seq OWNER TO iprieto;

--
-- Name: rol_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.rol_profiles_id_seq OWNED BY public.rol_profiles.id;


--
-- Name: role_rol_profiles; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.role_rol_profiles (
    role_id integer NOT NULL,
    profile_id integer NOT NULL
);


ALTER TABLE public.role_rol_profiles OWNER TO iprieto;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO iprieto;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO iprieto;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    last_connection timestamp without time zone,
    is_online boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO iprieto;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: iprieto
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO iprieto;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: iprieto
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_facturas_completas; Type: VIEW; Schema: public; Owner: iprieto
--

CREATE VIEW public.v_facturas_completas AS
 SELECT f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.fecha_vencimiento,
    f.fecha_operacion,
    f.estado,
    f.metodo_pago,
    f.subtotal,
    f.impuestos_totales,
    f.total,
    e.nombre AS emisor_nombre,
    e.nif AS emisor_nif,
    e.email AS emisor_email,
    r.nombre AS receptor_nombre,
    r.nif AS receptor_nif,
    r.email AS receptor_email,
    f.created_at,
    f.updated_at
   FROM ((public.factura f
     JOIN public.emisor e ON ((f.id_emisor = e.id_emisor)))
     JOIN public.receptor r ON ((f.id_receptor = r.id_receptor)));


ALTER TABLE public.v_facturas_completas OWNER TO iprieto;

--
-- Name: VIEW v_facturas_completas; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON VIEW public.v_facturas_completas IS 'Complete invoice view with issuer and receiver details, including operation date';


--
-- Name: v_facturas_resumen; Type: VIEW; Schema: public; Owner: iprieto
--

CREATE VIEW public.v_facturas_resumen AS
 SELECT f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.estado,
    f.total,
    e.nombre AS emisor,
    r.nombre AS receptor,
    count(lf.id_linea) AS num_lineas,
    count(a.id_adjunto) AS num_adjuntos
   FROM ((((public.factura f
     JOIN public.emisor e ON ((f.id_emisor = e.id_emisor)))
     JOIN public.receptor r ON ((f.id_receptor = r.id_receptor)))
     LEFT JOIN public.linea_factura lf ON ((f.id_factura = lf.id_factura)))
     LEFT JOIN public.adjunto a ON ((f.id_factura = a.id_factura)))
  GROUP BY f.id_factura, f.numero, f.serie, f.fecha_emision, f.estado, f.total, e.nombre, r.nombre;


ALTER TABLE public.v_facturas_resumen OWNER TO iprieto;

--
-- Name: VIEW v_facturas_resumen; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON VIEW public.v_facturas_resumen IS 'Invoice summary with line and attachment counts';


--
-- Name: workflow_edges; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.workflow_edges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    source_node_id uuid NOT NULL,
    target_node_id uuid NOT NULL,
    label character varying(255),
    condition jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflow_edges OWNER TO iprieto;

--
-- Name: workflow_nodes; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.workflow_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    label character varying(255) NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    "position" jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflow_nodes OWNER TO iprieto;

--
-- Name: workflows; Type: TABLE; Schema: public; Owner: iprieto
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workflows OWNER TO iprieto;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: authorization_objects id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.authorization_objects ALTER COLUMN id SET DEFAULT nextval('public.authorization_objects_id_seq'::regclass);


--
-- Name: certificates id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.certificates ALTER COLUMN id SET DEFAULT nextval('public.certificates_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: documentation_xml id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.documentation_xml ALTER COLUMN id SET DEFAULT nextval('public.documentation_xml_id_seq'::regclass);


--
-- Name: invoice_country id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.invoice_country ALTER COLUMN id SET DEFAULT nextval('public.invoice_country_id_seq'::regclass);


--
-- Name: origenes id_origen; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.origenes ALTER COLUMN id_origen SET DEFAULT nextval('public.origenes_id_origen_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: rol_profiles id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profiles ALTER COLUMN id SET DEFAULT nextval('public.rol_profiles_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: adjunto; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.adjunto (id_adjunto, id_factura, filename, tipo, url, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at) FROM stdin;
1	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:42:34.54568
2	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:45:51.175582
3	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:48:51.384172
4	\N	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:48:55.926658
5	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:50:34.367567
6	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:50:37.934821
7	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:50:52.512252
8	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:57:58.877719
9	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 11:58:12.586868
10	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:01:03.14828
11	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:01:25.073812
12	4	CREATE_INVOICE	INVOICE	77e47e21-62bd-4be8-965a-da377eedda4a	{"total": "5275.60", "numero": "VA09901203"}	::1	2025-11-27 12:03:12.633001
13	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:10:15.798641
14	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:13:38.681918
15	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:35:26.677304
16	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:35:35.560134
17	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:39:24.021185
18	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:42:19.100788
19	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:43:59.842252
20	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:44:13.103099
21	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:52:29.889484
22	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:52:45.376958
23	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:56:02.491258
24	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:56:10.868491
25	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:58:20.976716
26	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 12:58:30.331337
27	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:01:25.501171
28	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:01:35.173368
29	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:06:40.44982
30	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:06:50.127519
31	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:10:10.155048
32	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:10:19.091521
33	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:18:53.180451
34	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:19:01.756446
35	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:23:54.341241
36	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:24:26.257869
37	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:34:11.649953
38	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:35:30.924917
39	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:43:40.710759
40	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 13:43:50.529711
41	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 14:17:51.508883
42	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 14:18:02.428899
43	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 14:19:48.809534
44	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 14:20:02.975345
45	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 15:46:55.469798
46	\N	SCAN_INVOICE	SCAN	\N	{"filename": "invoice_F000112232321.pdf"}	::1	2025-11-27 16:06:51.099662
47	4	CREATE_INVOICE	INVOICE	a8e0d20d-aad0-49a8-b602-0f124c2e990d	{"total": "968.00", "numero": "F000112232321_2"}	::1	2025-11-27 16:07:19.387665
48	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 16:29:03.925475
49	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 16:29:47.95499
50	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 16:29:53.084221
51	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-27 16:53:45.301868
52	\N	SCAN_INVOICE	SCAN	\N	{"filename": "invoice_F000112232321.pdf"}	::1	2025-11-27 16:59:41.976991
53	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-28 10:51:26.602435
54	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-11-28 10:51:49.624206
55	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-02 17:56:40.70715
56	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-02 17:57:30.056221
57	4	CREATE_INVOICE	INVOICE	438ecd18-0c90-4a8c-85db-6bd678e5f7da	{"total": "544.50", "numero": "TEST0001"}	::1	2025-12-02 18:03:30.989525
58	\N	SCAN_INVOICE	SCAN	\N	{"filename": "facturas-2.pdf"}	::1	2025-12-02 18:05:29.318411
59	4	CREATE_INVOICE	INVOICE	e70e420c-13c3-412b-9bae-eefff6b53c44	{"total": "58.71", "numero": "91052025A100063663"}	::1	2025-12-02 18:07:06.501933
60	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 09:08:14.705174
61	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 09:08:39.551555
62	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 09:57:01.640973
63	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 22:59:10.051918
64	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 22:59:16.560938
65	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 23:13:55.348427
66	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 23:14:00.766982
67	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 23:14:45.253342
68	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-09 23:15:00.742404
69	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 00:57:52.236559
70	4	CREATE_INVOICE	INVOICE	cf21054a-bc3b-487d-91af-1f27ad0a8e12	{"total": "352.00", "numero": "INV-ISUE-000000000030"}	::1	2025-12-10 01:11:26.6089
71	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 01:16:36.520991
72	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 01:16:42.657392
73	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 09:44:50.109356
74	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 09:45:05.828291
75	4	CREATE_INVOICE	INVOICE	369dd89c-c177-4b60-9b89-de04a558470d	{"total": "2640.00", "numero": "INV-ISUE-000000000040"}	::1	2025-12-10 09:48:24.785501
76	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 17:37:24.092631
77	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 17:50:21.841161
78	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 17:50:26.357408
79	4	CREATE_INVOICE	INVOICE	2aac25fe-d9c2-424c-9433-be109080610a	{"total": "3517.80", "numero": "INV-ISUE-000000000041"}	::1	2025-12-10 18:03:37.781546
80	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 18:10:04.445746
81	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-10 18:10:10.101741
82	4	CREATE_INVOICE	INVOICE	b21b9e36-50eb-4e12-a932-f1f94509c91b	{"total": "726.00", "numero": "INV-ISUE-000000000042"}	::1	2025-12-10 18:10:46.252504
83	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:29:08.023033
84	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:45:57.765719
85	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:50:36.721157
86	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:50:42.668182
87	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:58:24.379251
88	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 22:58:43.248284
89	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 23:04:11.18424
90	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 23:04:19.936527
91	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 23:14:21.80324
92	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-16 23:14:27.593649
93	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:04:33.202138
94	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:11:14.407875
95	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:11:21.447684
96	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:36:48.249867
97	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:36:54.272838
98	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:50:46.621767
99	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-20 23:50:53.114108
100	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-21 00:17:00.405688
101	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-21 00:17:07.33533
102	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-29 23:50:06.024391
103	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:27:39.582021
104	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:27:45.377374
105	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:32:30.150969
106	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:32:36.657615
107	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:38:36.101841
108	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:38:42.616631
109	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:48:28.72483
110	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:48:36.634037
111	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:51:52.440992
112	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 00:52:00.587787
113	4	CREATE_INVOICE	INVOICE	fd4e3697-4bea-47b4-a951-537d1b958367	{"total": "217800.00", "numero": "INV-ISUE-000000000043"}	::1	2025-12-30 12:51:56.393035
114	4	CREATE_INVOICE	INVOICE	a6e4ca59-9ea6-4622-800b-a50405233379	{"total": "14520.00", "numero": "INV-ISUE-000000000044"}	::1	2025-12-30 13:02:29.246653
115	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:03:03.762527
116	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:03:09.571007
117	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:24:07.853404
118	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:24:14.047462
119	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:26:44.465652
120	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 13:26:53.360951
121	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 14:22:16.441042
122	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 14:22:21.644376
123	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 14:47:52.134144
124	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 14:49:15.889138
125	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 15:00:56.657011
126	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 15:29:09.731128
127	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 15:29:15.324094
128	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 15:38:07.18863
129	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2025-12-30 15:38:13.225006
130	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:19:38.290519
131	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:20:11.445517
132	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:20:17.003146
133	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:30:55.493904
134	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:31:01.561094
135	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:36:39.058683
136	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:37:47.932382
137	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:42:42.050017
138	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:44:35.038496
139	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:46:19.126367
140	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:46:29.511455
141	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:55:09.184286
142	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:55:15.010677
143	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:57:46.071368
144	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:57:52.91979
145	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:58:24.563992
146	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:58:29.477219
147	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:59:08.342936
148	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 08:59:14.616419
149	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:05:24.505084
150	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:05:29.940162
151	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:07:01.756197
152	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:07:07.011091
153	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:15:27.946494
154	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:15:34.417952
155	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:25:13.083574
156	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:25:19.283656
157	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:30:50.654435
158	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 09:30:57.181672
159	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:10:38.575892
160	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:16:28.868674
161	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:16:35.6284
162	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:23:36.820863
163	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:23:58.894022
164	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:24:41.892598
165	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:28:42.522316
166	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:29:45.661472
167	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:29:52.809663
168	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:31:22.562347
169	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:31:29.475031
170	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:52:27.045571
171	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:52:32.474266
172	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:54:58.155461
173	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:55:05.460136
174	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:59:36.657928
175	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 19:59:42.075652
176	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:02:43.53427
177	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:06:09.58282
178	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:33:00.765781
179	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:42:05.518199
180	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:42:12.920911
181	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:48:34.843087
182	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 20:48:46.966102
183	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:28:02.380333
184	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:28:08.726211
185	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:43:10.952147
186	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 21:43:33.478506
187	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:44:27.596757
188	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:44:33.094987
189	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:59:13.965642
190	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 21:59:50.342166
191	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:00:40.513848
192	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:01:49.356968
193	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:08:28.430145
194	5	LOGIN	AUTH	\N	{"email": "usuario1@t4s.com"}	::1	2026-01-04 22:09:31.380585
195	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 22:09:58.269728
196	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 22:10:11.044872
197	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:13:15.265523
198	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:16:23.23823
199	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:18:12.607754
200	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 22:19:20.996391
201	1	LOGOUT	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:19:58.274548
202	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:20:03.306862
203	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 22:25:44.201063
204	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-04 22:25:52.320434
205	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:26:12.991158
206	1	LOGOUT	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:26:34.240915
207	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-04 22:26:37.327486
208	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 21:40:37.566271
209	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 21:42:19.821113
210	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 21:42:26.385666
211	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 21:46:35.073837
212	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 21:46:40.054764
213	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:03:47.22102
214	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:03:53.044751
215	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:07:29.405401
216	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:07:34.054803
217	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:08:56.833593
218	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:09:46.911807
219	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:12:16.048915
220	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:12:22.948785
221	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:36:51.076
222	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-06 22:37:01.277725
223	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-07 22:46:10.235244
224	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-08 20:47:08.503804
225	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-08 20:47:14.050774
226	1	LOGIN	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-09 13:51:00.50854
227	1	LOGOUT	AUTH	\N	{"email": "ivan.prieto@icloud.com"}	::1	2026-01-09 13:51:09.430814
228	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-09 13:51:15.700517
229	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-12 10:23:54.015326
230	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 21:36:56.943896
231	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 21:49:29.898941
232	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 21:51:05.379475
233	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 21:52:17.803402
234	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 21:52:25.590151
235	4	CREATE_INVOICE	INVOICE	ecc69318-4273-48f4-ad16-ebddde2783b9	{"total": "121.00", "numero": "INV-ISUE-000000000045"}	::1	2026-01-19 22:00:47.617976
236	4	CREATE_INVOICE	INVOICE	ba34d2b0-8fe8-45ca-b554-06bcd18a2a3d	{"total": "7260.00", "numero": "INV-ISUE-000000000046"}	::1	2026-01-19 22:08:18.623124
237	4	CREATE_INVOICE	INVOICE	cec07a99-d55d-42ba-8831-7f1133448466	{"total": "7260.00", "numero": "INV-ISUE-000000000047"}	::1	2026-01-19 22:15:25.310258
238	4	CREATE_INVOICE	INVOICE	76a7bfa3-c238-4f6d-ab05-e0eae7a443ca	{"total": "2420.00", "numero": "INV-ISUE-000000000048"}	::1	2026-01-19 22:16:52.035113
239	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:22:47.808319
240	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:22:54.010645
241	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:26:39.603082
242	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:26:57.841306
243	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:33:49.158035
244	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:33:54.045528
245	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:45:45.051289
246	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 22:45:51.126081
247	4	CREATE_INVOICE	INVOICE	0708d2aa-8870-4229-98b1-c0665b7a7ab8	{"total": "20570.00", "numero": "INV-FR-000000000001"}	::1	2026-01-19 22:57:20.828681
248	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:10:00.243812
249	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:10:04.823536
250	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:20:46.490451
251	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:20:51.839393
252	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:42:15.863161
253	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:42:46.992842
254	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:47:48.710271
255	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::1	2026-01-19 23:49:35.631997
256	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-20 00:00:55.051325
257	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-20 00:00:59.843426
258	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-20 00:02:17.209943
259	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-20 00:02:20.63648
260	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-23 17:48:23.786061
261	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-23 20:49:39.632454
262	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-23 20:49:45.102433
263	4	CREATE_INVOICE	INVOICE	f7e0172b-4749-4879-8124-b43afab90f98	{"total": "3630.00", "numero": "INV-ISUE-00000000049"}	::ffff:127.0.0.1	2026-01-24 10:45:25.591036
264	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-24 10:46:54.066404
265	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-24 10:46:59.516293
266	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-24 10:47:51.290203
267	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 19:46:57.873568
268	1	IMPORT_SAP_INVOICE	INVOICE	b4a517c4-cf2b-494b-bf3c-c242bf2a82a2	{"process_id": "SAP_TEST_1769368126764"}	::1	2026-01-25 20:08:46.931428
269	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 20:11:05.554233
270	1	IMPORT_SAP_INVOICE	INVOICE	954c89ca-f278-41e6-824f-cdc5fd4261ae	{"process_id": "INV-SAP-00000000001"}	::ffff:127.0.0.1	2026-01-25 20:32:16.24925
271	1	IMPORT_SAP_INVOICE	INVOICE	ed645057-d217-457e-a930-bb6d4d816c3b	{"process_id": "INV-SAP-00000000002"}	::ffff:127.0.0.1	2026-01-25 20:35:14.78007
272	1	IMPORT_SAP_INVOICE	INVOICE	d64f1da0-61ab-4cb1-a58c-1b2efa4e283d	{"process_id": "INV-SAP-00000000003"}	::ffff:127.0.0.1	2026-01-25 20:56:05.990374
273	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 20:56:46.997519
274	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 20:56:51.735259
275	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:00:28.956337
276	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:02:02.478337
277	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:02:07.705941
278	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:03:31.56047
279	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:03:37.016079
280	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:06:36.18672
281	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:06:41.653064
282	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:09:16.146532
283	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:09:20.439827
284	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:13:45.360268
285	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:13:49.713301
286	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:17:15.972705
287	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-25 21:17:20.995031
288	4	CREATE_INVOICE	INVOICE	f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4	{"total": "12100.00", "numero": "INV-ISUE-00000000050"}	::ffff:127.0.0.1	2026-01-25 21:22:55.807062
289	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:07:00.258935
290	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:10:19.158843
291	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:10:25.729114
292	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:13:21.197172
293	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:15:36.367803
294	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:34:56.275759
295	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:35:02.446054
296	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:55:21.43667
297	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:55:28.211033
298	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:58:56.945622
299	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 11:59:01.977726
300	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:02:32.836807
301	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:10:08.679711
302	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:10:14.298577
303	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:13:51.625836
304	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:13:56.860059
305	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:20:12.994182
306	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:20:19.653
307	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:26:43.232952
308	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:26:50.735153
309	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:39:41.35244
310	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 12:39:47.141214
311	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 13:00:19.519544
312	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 13:00:39.557658
313	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 13:02:16.128729
314	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 13:02:55.462269
315	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 13:04:46.888138
316	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 14:39:13.643593
317	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-26 14:39:20.646959
318	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 09:36:35.423877
319	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 09:40:34.90539
320	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 21:31:31.326141
321	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 21:31:36.910669
322	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 21:53:01.889574
323	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 21:53:07.16465
324	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:08:00.41501
325	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:08:05.344698
326	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:16:12.881735
327	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:16:17.879059
328	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:28:53.318668
329	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:29:01.265296
330	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 22:57:05.656053
331	4	LOGOUT	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 23:45:44.874374
332	4	LOGIN	AUTH	\N	{"email": "test@example.com"}	::ffff:127.0.0.1	2026-01-27 23:45:54.541295
\.


--
-- Data for Name: authorization_objects; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.authorization_objects (id, object_type, code, description, created_at) FROM stdin;
1	ACCESS_APP	APP_USER_MANAGEMENT	Access to User Management App	2025-12-16 22:43:32.769731
2	ACTION	USER_CREATE	Create a new user	2025-12-16 22:43:32.769731
3	ACTION	USER_EDIT	Edit an existing user	2025-12-16 22:43:32.769731
4	ACTION	USER_DELETE	Delete a user	2025-12-16 22:43:32.769731
5	ACCESS_APP	APP_ROLES	Access to Roles Management	2025-12-16 22:43:32.769731
6	ACCESS_APP	APP_PROFILES	Access to Profiles Management	2025-12-16 22:43:32.769731
7	ACCESS_APP	APP_AUTH_OBJECTS	Access to Auth Objects Management	2025-12-16 22:43:32.769731
8	ACCESS_APP	APP_TILE_FACE	Acceso al Tile eInvoice FACe	2025-12-16 23:13:52.094326
9	ACCESS_APP	APP_TILE_TBAI	Acceso al Tile TicketBAI	2025-12-16 23:13:52.094326
10	ACCESS_APP	APP_TILE_LEY_CC	Acceso al Tile Ley Crea y Crece (Dashboard)	2025-12-16 23:13:52.094326
11	ACCESS_APP	APP_TILE_POLONIA	Acceso al Tile eInvoice Polonia	2025-12-16 23:13:52.094326
12	ACCESS_APP	APP_TILE_FRANCIA	Acceso al Tile eInvoice Francia	2025-12-16 23:13:52.094326
13	ACCESS_APP	APP_TILE_BELGICA	Acceso al Tile eInvoice Bélgica	2025-12-16 23:13:52.094326
14	ACCESS_APP	APP_TILE_SII	Acceso al Tile SII	2025-12-16 23:13:52.094326
15	ACCESS_APP	APP_TILE_VERIFACTU	Acceso al Tile Verifactu	2025-12-16 23:13:52.094326
16	ACCESS_APP	APP_TILE_FRANCE_REPORTING	Acceso al Tile France Reporting	2025-12-16 23:13:52.094326
17	ACCESS_APP	APP_TILE_301	Acceso al Tile Modelo 301	2025-12-16 23:13:52.094326
18	ACCESS_APP	APP_TILE_322	Acceso al Tile Modelo 322	2025-12-16 23:13:52.094326
19	ACCESS_APP	APP_MENU_DASHBOARD	Acceso al Menú Dashboard	2025-12-16 23:13:52.094326
20	ACCESS_APP	APP_MENU_ISSUED_LIST	Acceso al Menú Facturas Emitidas - Listado	2025-12-16 23:13:52.094326
21	ACCESS_APP	APP_MENU_ISSUED_NEW	Acceso al Menú Facturas Emitidas - Nueva	2025-12-16 23:13:52.094326
22	ACCESS_APP	APP_MENU_RECEIVED_LIST	Acceso al Menú Facturas Recibidas - Listado	2025-12-16 23:13:52.094326
23	ACCESS_APP	APP_MENU_RECEIVED_NEW	Acceso al Menú Facturas Recibidas - Nueva	2025-12-16 23:13:52.094326
24	ACCESS_APP	APP_MENU_SCAN	Acceso al Menú Escanear Factura	2025-12-16 23:13:52.094326
25	ACCESS_APP	APP_MENU_UPLOAD	Acceso al Menú Subir Excel	2025-12-16 23:13:52.094326
26	ACCESS_APP	APP_MENU_CATALOG_NEW	Acceso al Menú Catálogo - Nuevo Item	2025-12-16 23:13:52.094326
27	ACCESS_APP	APP_MENU_CATALOG_LIST	Acceso al Menú Catálogo - Listado	2025-12-16 23:13:52.094326
28	ACCESS_APP	APP_MENU_WORKFLOW_NEW	Acceso al Menú Workflow - Nuevo	2025-12-16 23:13:52.094326
29	ACCESS_APP	APP_MENU_WORKFLOW_LIST	Acceso al Menú Workflow - Listado	2025-12-16 23:13:52.094326
30	ACCESS_APP	APP_MENU_CONFIG_ISSUERS	Acceso al Menú Configuración - Emisores	2025-12-16 23:13:52.094326
31	ACCESS_APP	APP_MENU_CONFIG_RECEIVERS	Acceso al Menú Configuración - Receptores	2025-12-16 23:13:52.094326
32	ACCESS_APP	APP_MENU_CONFIG_TAXES	Acceso al Menú Configuración - Impuestos	2025-12-16 23:13:52.094326
33	ACCESS_APP	APP_MENU_MAPPING	Acceso al Menú Herramienta de Mapeo	2025-12-16 23:13:52.094326
34	ACCESS_APP	APP_MENU_ADMIN_ORIGINS	Acceso al Menú Administración - Orígenes	2025-12-16 23:13:52.094326
35	ACCESS_APP	APP_MENU_AUDIT	Acceso al Menú Auditoría	2025-12-16 23:13:52.094326
36	ACCESS_APP	APP_MENU_API_DOCS	Acceso al Menú Documentación API	2025-12-16 23:13:52.094326
37	ACCESS_APP	APP_TILE_COUNTRIES	Acceso al Tile Países	2026-01-04 22:23:51.220861
38	ACCESS_APP	APP_TILE_WORKFLOW	Acceso al Tile Procesos de Aprobación	2026-01-04 22:23:51.220861
39	ACCESS_APP	APP_TILE_XML_DESIGN	Acceso al Tile Diseño XML	2026-01-04 22:23:51.220861
40	ACCESS_APP	APP_TILE_349	Acceso al Tile Modelo 349	2026-01-06 22:11:41.491925
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.certificates (id, filename, cn, created_date, expiry_date, chain, active, created_at, updated_at, acronimo, encrypted_p12, iv) FROM stdin;
1	certificado_prueba.p12	Test Certificate	2026-01-23 20:59:24	2027-01-23 20:59:24	["Subject: ES, Plasencia, Plasencia, T4S, VASS, Test Certificate, ivan.prieto@t4s.com | Issuer: ES, Plasencia, Plasencia, T4S, VASS, Test Certificate, ivan.prieto@t4s.com"]	t	2026-01-23 21:02:37.964598	2026-01-23 21:03:13.40994	TEST1	6ae34e73bad5f0108594eb252e3471996111c5b5d8df4d82abf8c8cb367043bba79ef4a75764f4d4fde50ac477f1dd5a2514cbeb5755c4aaef0f27fd752c88b34321632888d9defb9e81983771e195d5822fefcdfa18e24e39c26ecb6238c1beb10acdf78af97529af0c9890e53c6c22c0d02c86c1daf4f5411ab6be7597c2779883bc3e7b0f2190d9e7a5aa37e9e05539d6ce7dad5771f951c9dc788f2205bf053bb1de88009397b1820257ca333b0368084aa6b8fc8b39768756d290b7126ffd297f4dd9c0d25ce78510804385dc9d40c6111d71e34b8e969011f6c47fd354c157c863d6361c536c3b3ed76e3b4f9dc7e4f641ed4a7e5927484fa417f1f7f09f5fb5f04a6eaf81fb57606a11a871be0eb4f34d6af67b1268a0a3288825bf6f19b6ae5989c8f188fb7d61a8ade43262666d0f8841af901dd16084513bff6a40bc5c553a164187e01dac74a6f2306ecfb5694065de3aa732b9d58d877efa2520d024f63640a2ea8b0acf85f37371e0960e654ab7353b2c8d4acaa62fc0df940f1de3c7e2da035de917da73fc601ff857d477cd911daae696b9d999205bf68c023d987b7be4799be1112bd7a4eb75a806d5b8787d100644919f84d306b8ba5e04c1a812eaf73c2bf09ce58a16b262e5d1fa6809ab000187eb88dab2b142e736bc191c0217891ce84c5f30e660306f23c951e20a390cd6eeec99da186c902157431d8c934decbef415ca5bdae2e337aee088e7c7fb9b7c23ce99f771118ab63e909d8b70efe6d811c6580a1374caa5481f3e223957e9708d4c0fe27f26519b9d27d0e39ba0df0f41d358bdcb40937840639b8a40d4b27eef7703b36e35eb600f242ce9769815878ecaac0bb3bcdc6e7099b1a45bc02a25ff4f8eb2745052d3e9e6c94b1a448e345e5361558b96bbc2a266454b0fc22b291fbbe1e779f18f1aa16e4abbbbb1b3fa49265351e5a88a4b036188c955a8209019b3a944cde01fb0af4755c78b3f82e67e3b7c0fc06468e1a18ebf1b67dfa5298d3bbe8094bbbb7a0adfacfe57eb4228c1820b78ea35dc3b15e4c2befe3718771b639fedd4c0080be005dd27e256ca31905800343d9d31e2f5d612688518e8565087405b0929ca3745b727f5161b3e8d8343c5e24d2f79cc61f3ce7f2d0ff4e45d766308d1fd6d9d9e77acb5be6aa255719edd1a77e084ca11f43ab41e4ae148a96e20c484533d89bb2bc6bf7299ec9d3f273e98de004f41e819ebc94f2f41a71e525bb041a6f20f230d84c8ac085df981ea3b441fd6dfda93ea461418a9e61af1e731210f67912d4f46329ab9fd6b3c485db13948899b029bea6ff1ff0ba685d831b73beccef7130e097f11d8e569a4be062fa42cf1c809382e8049a56a733aa510c19e2e3936c9cdfeeb76f0a8daa0beb6ab27ee96df4f4412454b35ccc9ebbacd5fc57904c350340eb28f2548caa6d287e213ed948d8eedb57e53b4a1cd3b217cc395e80ff87b2764a38d60f342d60eada3eccf461ad8dc0f8841e78d456f538673e5d35e745a7f36f712f6d8b9b6c439209536cf7e01b24629c2f5ff2f7f653515092372037a76dba21a8beeaa4d8eed026878790e02655e4bb32ec5c092c85aa4448bcea343f75fae2e0f33037c455a65943c2106635cbff1f1473510caf7976d3660d472efeb8ca4fb1e993351c6c1b2c4d9d2cac28ed751803593ade51240b35d954f60f06df95ef80a1052c43cc4dccd2637d4e49b23df83fbde7a57c3aa5a8250e3ba8fd18d282bcebab106c3d62a532452b96f012a564a31686737fd80abb5a47e01610ddd97836e121738a105483f6c156234ce918a490310cf6b61dbde74e9aebbe043888368259f218f5faf2329b4bacbc58ec8b07406b0bcc07531e24137b75b2b03de95ed5809d62f600d566b85209bc2e43f54a19abc1d499d1c9433da26a0aa6d19c0323a84b2649ac69650bc3484a873550544c777e5f0cc19687d2327e43129688c5fcc5831d751e27a3fd044f2267961d88b9529c7deed9e5b87d3821f847a9d1128da7acafcd244784c68d81fbb8a31e9ade7070659a487b3d884276d6c1f8ec6c46ad69190b6f4abe97b524f1deadfa8c36a8627091b887ce2745fc924b9ebae9c436473c6c7976ee07dc95e5df7968f17346cdc039a56ac485c3546f567194f3f53833a570e98c0b405166fef702b45310213fb4a7e0e3b80432754dcfb88ed58f47941171b47b21027d57feaae53cf3bc3e877ee4c521882ba9e2696cad9f529299fa6670a2747d10f7e9a3e6cdb7536dd469621cf5b767d2be22c85e55c2cb6198ea9e28c34b902b21dd32c5fa19a337a632478e9d9fef69c9965ea2726875c68383552b5d4660f902456fc0721454fddc657cf59ec38d57a166b5cb4f0d3a1bf9589d0832ef4bd022ed73093d34cf85374b889ce59667570bdf328ca506ff872f6dcc82af9f271576cec65ccb6653e01f5bf4773a410b3d9c86270be763521a146b185f8ebc771268391ab3a3df4ab53b3d2bcb18d8545019815b43d11344346f354e8155ebf08226a97b8badd2dbbadedbd6669fdf870de4227ffc83c574e5b7f2ff25e1b8674e143f34ff255856f7b9279fdb8902243686f1013f4ba33663251908b124ff9c785d7034ba33f19e5bd07d28b072be7b13e3d7d2090b2d7d146d3369010f3ffb2b5c3b7d592900a7248c4c098e4bafae960b322521b7caf54034392c7d386cedea4de037396cee38a37120c253b6c4a43be4969e5a75ed48b25bd46012a50d0b2d491f0c87c691629a3cdb8d67784728915a40ef69e20705ad7d6e1e7b644a3bd1d6aba39ffd4e511b58bf2aec6ebe82d2f0a4b78de5a9b2f25cc19f94a4cb74cec131029c62480623f72a2afce4fab6b267be262c0ce2637b39548d71655d2e3cd135f7fe733026d4d536be1e16eb687b7eb9818d1f13fc0ba5ac23a7f9b199956d34fcb3bc5306298b3aea9b8b55bf3a2fa80091556d8282186203f128b8d537fbf310622698f4412af7a5ca8fbb37e5dd70e5ae8778604e61bd5d3a315aa42fd59df12bdc2f503275c4f89627283c85e244085c98b7d5388c5f783838d23442a008fa674c04a824659ba0caa093c55e46dbca3bf7067345085b45c05cb0e3c2dc43abb606ae16e634ad3bddb050c3013326a30ea233015a9377838bb6af4ff3b61e15643a6489f4ce8f6f10eb08377f95d84397931d7756f44596afd60065845a6e4f0dfae7172488feb484a9c2bc72e7b5d70c28e342f93a45427137cec8546e24bccb67b8c34c2b680bd85c33bf95590b163ef86e54ea3508508c92e3f2f5183c5983e8a83e3557ec94f1b548b7626b398240526265fcd9b9444ee74e823ce0a14c3e959e5830653cadd70081c66a30aa93d8e55254530625b20ef1b74c87eae855d9e2d5388ec185fde34eebf4a281a9513972cbb74ec58f7a0e42179beea7bf44a5e6a78bfd9b4c4e46addc08940a4b9f83b949612b1d49000a58448ab01745b5ab0c35596d6a05c52abbc248528e33e3ed676fb3b73b6f18555d6997774ff9807051ddd731dc87f6315f322f2b99b3d2bbf113ac9c33b36a7af5979a0e72cf47f5ae828df9491233ea073a77de19bce6f2ccc30c59ea2fce1cb85218e948e1495f9fd90a0ee9650f1d4a14c5a4cd5f25bb83fa4f616579c61299b48406e5ac0645b38af8024229a5332249b1c56ace4465ee2f407ddaa47f00edfd4d853d707c59ea56530ae7436b5ab29469f9e350a6c6f32022174f9cf5fa2bf7aaaefb03166c9f528100875a70488e761006f0362183fab8eb2d6cf36f29ecf223f648440f7a257c6654e8dbd68205b90fd85c1a9f97d41be9c41dfb0f70423a3c11fef705e347ac2c87e8c5b948403639baef7fc710110ae415248842ccf7ec49d51a90e004140cb41298c1c41f5a1815c41d8a2a990723f0bbed42c2db6ace34b4874fd3962eedc06b271a6f3ececcb590451636ceb0c7ea60929e1109dee138be644c1b1634969257e0fb9c7eaf465e9d7648852a2960924f6916aae11cc080ae1f854f5cc28ba065212893db41531f268972ee109b92f5f38edebcdd8fd85c885689149d32d954dce49c6b5abc74c73a63866c99813d1876a328350aeac9962038c46288254a1245448b3cbb506fb840dcaa9db230e32bb218281933c43ba56de375030755abb365666d6cae22b5fce984951d8d4db7a2219ede0dc7ca70f5e05e48ab5bf54721c1ab7c6af1a0597df45fdfc95e4a1f8882b1ef677c92a9f0c5e833db48fef544cf58533247505adbc92e38e1c9e6d292e5f166088e3bbc24b5f0dd2fbef54815a7f25d97d73ad37de69f9d792908e785143f22de7ea61685ebfe9d34cabfe46be1f28cea37fbdcbf0d520c419a5cadf0886954f7a6c07770f9cfaeb0f677e21a2d16048bd69eb80db6944cb2f57843aecf7d55609e86c5be503a11b88f7c28835873efd86cc1569f95eb56c066e9b50ccff4eef8a0f91f0d889fc5ad8f6f3bc18ff811e93c75ba1113bc30efd26c280dd677105ab741b80c1aa8d13ebc07fcd6c642a4b382b4bf7400bfa28e547e13ef1db22a53b55674fb7f61a8f4f0df6f6c4f915afe0de6ef380d36bdd6ef0b8b45e2f29db35517331534d4cefe887e0db9beb09f44b3e9d45f6d338136354b4d7d314c1ad11d4779c5ca22f8b9b51a6186cd5c739de7c4af13c132aede5f1c7b228ed074055674ac3285fa1cc843a72c30ae71a673e2a6f81da4974a5723c0d06989bc2d40b6bb8e45b1aca696b655e7b9e9b77f2262cd5aced8b09b51b25386c06f0ecb9fb9236bee98b488b542e9100f8b01b85891b34ff10fd33bfd7b56e797f90c4c8717e1be9f0d2db2d9c6c011e4e1d99460fd9dfab1658bef80199efd0459c70632f22815c480fd4baabb7dd40100df1b30d2a6e6b2ad5ac2b6adb2b8497c33fd57fc24fa5f241a979306d42579514d852c3439a460961959e50698fd1bfe300bf257300aadda3cbab961284fe0d66b0e53aa0fe8616e0e1d7217ad07c6d69982e22602e7f589bb42c79f482430982773c364fd1627dd181e9c75029b5a7fc7860a35012b36fd968514b977acfe2fe81ddfcdb27c0cbaf06de169d25fc0cd02848879afc77ec172e89be2f4b3784498f61d815bdd4a06f9a40f2cca0ad6a8d642d678ea7755ad06eb16ff6f386c51e6fec55ed9bea092fb24617d30d1b86590988f82b7d98498d6d8db5f2042155fb4c59d6f170cdbfe0ca2de9d77d276cceee4ca93d267ee2aab1065e3b441f747a4eb4fb387789ed07d0e166a2f84c47e7b0c7320c8ee0f9b4ca115056828049354232f4762bfb3aa74ee0598271448063e1782f02dee4b172e687e510045c9a06bcac5a1cd58ac43c982dd5ce991dc73265ab8ed298f8c350238ef26bd041ddc0cf900a34e84545754dcab4cadac7b9ac4790baaa145986946a3a63771f5cf4e9e5cb566aa7f04ddb37a5421b7366337c1fbc8f04b20ef58e43b4dc9f832ca00aff234fb9fa8389859044c29909e124660d61f2715e28fa60e3f4016a46c1700fe19446883d8418b4b475a075bbd91aff2e79d3be9453f8c66c3191d5b17446dbc52a9d6e17271bdd80e9043bc5de4ad8ddad664d2100bf0bad4b85a67c1559221a74465f787ea081a9bf5c2272c20e3558a2b112559aa6eae1685bba32987512ab10749c4f86692f2ad15991ff17f92c0a4f6203c2c065771ce47437e455e75ebf8c3f02aac50d30172b17dc1f086a3f4d6384360786391769bb0b4af642fea3eaac8da1c9deffc8ef5825a71333dafe0069ad640875751497f50681a1f54cd3da7bf0307a1ecd1a933b8219eeac4b9285b0cb801e0afcd00891427e9bfd37a3881aa4582980e931a521123e2308b670382fc13cbafe36b95aaf47243249516c4e1ec344cfd07da51f36bd2b0866d5bb124bec6bba94ccce95ff1b836bcdf56ea0d7	33183e20e8de221d8d8863fa
2	certificado_prueba.p12	Test Certificate	2026-01-23 20:59:24	2027-01-23 20:59:24	["Subject: ES, Plasencia, Plasencia, T4S, VASS, Test Certificate, ivan.prieto@t4s.com | Issuer: ES, Plasencia, Plasencia, T4S, VASS, Test Certificate, ivan.prieto@t4s.com"]	t	2026-01-23 21:07:31.604086	2026-01-23 21:07:31.604086	TEST2	54a14b9225c86e1d0ac21ecce0463c2cb6e95898d4c4542f0189459af0b86f3073e61aae0ac041d14c6d1acfab375c8b81160f1cbe4eefb009800d9edcbc3b368837abdc10b75184a10972278015828a0c92a9da1f48e2fd9ba308e49b07b8fbb61a7f5474c2161efb09b4c15f9562aedeb196ea00beb727e21455435363259e583087bb5e68a86320cc00734efce8ab7e4e055c7c1fcc8e48b3c38c382b39be6ca0adedf73eb8e171f47ec8386f6f0b47bf97495e2b2fd7fe11c20dd5119cc4a9e28742d07680b9f4bc47ad9e7647390d7f591b82b2406a5b5049684926e6df3dc028bc28b0b06fb7f311484389996570b09daf619faebd8dc3f018a090a846b827e0e51e9a9133c0a6d1743fbf36b93f53504b919d3e955ba9ec1f9581376f41341db2155e5c8e5e18f73631398a8f855ce490062bdb2cd8195bda1aeb591cd99cbe9f18bd561772b22c392e45e790c45b5cfc3e491d38fe8d06da8c1ddf183c824606c2e644bcba8db5ea1e821e2ba45be3d2780466cd7e981985311609a0ad32d016437e348ca0491e4da3982b55b445bb773b6eec1927bc8a2f8798fc0d368c63329e70e0031260b708f7564a52e1e90adbad5dbec372afc226b2c89ce6ae965d4b0e3c31fadefe8b9b8f63165132aef2a3b276da67c051805e49f053a1912822e0b68bb4572d39f77798cb633ef7e63fcdc91ae71ecaefccd101be767b88bafa12d5f532286646032adcd55722afce64c72e58f63ba57c9cc8ddf3987937e4c84af30f4e29900358bcb8a88eb4b2b26b0ade1ab6529c56a4b562c3490e4594d75f3d3f48f04ce0eff81cc17cbdb2a42cf6d06197c0d5fa25d4af08966f4db83ea6312035b52380fc8dfc8ced5844938f47da40a18189da241cd645139c6979dbdcbe66aefa6cc5fb9df6d7ac82cf06fef8d4173c473edac1f30fa1a0f34f702a5f1c8c12cf221eca6573f8904eae8428c3c8b0e81e552ea31a8fb3bd8c6b6670cff6a82fa5f9955804b63e2d7066aa56bcc8a46dbd116866f98240acb93112e806460163e4b48237118d082c2b7a2d37284d8c567821a816d9b83da4b48f0ace6264c546383ce8183b3fb9147d6a97d47059242e0726e58e5a1673f10c16a00bd4fecff9c8c294337bf7f0770ef91b3f9bd63910813333212f1db9a019791976b5275f3e38a37b0f10d6ccec59b759de39a71808553f6349548ca25c6e627eebb9059d13a43bea9c883929d5179bd8640a3b6d1dceb137515a7573e0166cf1b76aefbe7ae426bf0c9fe0c326e6baa0f570059083406d3136ee422dd764658788fdf7e08fa709486422af622645500d061545546ed6691931dddfdd8dd779fbdc165b870e47b0dcaac957becd4ccea9acf3f970ef00fd8819905e1371536d459ea5cb546fa941e4ac3c97d99ae7121960a1b7db8b4127530ee574168b55c91a9402adf973d5096b2bb77ef4902829e5455ab83563bf79c84cb9f7c64c9b233ba656ab64a593ea2fc01fd6a81bd13bcfa4cacab3b3d3837214c08c615061763cf3d1327ea4391b37709b492898ae298c9165698051977d0fbb200931e8d4865cbac0b5153e8ec1a21f01df931fb3be84b2f9bba6d4fd8902ddbf68fca6724d18b44251cf2a8091431801fbeb0b1d9d0cd456672af281bf711a9dbd9138d913dfbb9fa45cef01bead83a09688e929ca48b8787c59da9e14b776ff4004b2174f9d61ac849ed272d8eb29ea71009c60eba355e807463ac8a73f3dd60a645840328d78db99d735411df7461d98132cdb17d1121dc4c17af8335688a762a1777dee69d42e46ecd0f12686147db2472397b5f1add64a6a793467448173809c8c25f71240b9df44836c440d7c5bb9355725c3a730d17c920b9efa3703c685d43c6500652311df5a6deee78cae11b13ec5838b2d6015f3ca3aec84367eb5f72f0fb994764ac47d9d44080380e3a99ad926f13287369ab8409f7dafe2bb8898da73766f2ddae80d0aa67862a2093ac7981d42981eebaca3def51bca161a0a53dc71e4dcbbc60d3d3e3f3cf067002d42552028f39483d006ba6e312f2628a8e2a087c181720d0e88591025772607ba06b98b64b9464429561f86254a8fccf1cd4f8ced428f32f639338021069b5793d1b77a0f5fae7e09077b76ff281588f250918e4a206dddf06d62c95ee473cb3510dca21eff5e368c449465720dd37fc5887672c2d92c0f88d9d307601898e05dc2862cc529fb1dde8e3bf39ba334fb579f905620a7b6216cd9ed799fb8532c81706e851bbf63c5aa1d3bbffbd3f8b2e6a42a50f868c435089c7439a86189a5a79c4f4f96a0a434843c2fae6abd6166f9ab99593015a2434f51887b7cdc2a270d8bada52523969d97ef07265d703d06b085689cd5584227f219ee3a5e2107a5692f7833e059013befc404c872e326244f5ef5571bd1c747d4ee7d2d2564846ea01eb7785b1d44cb198dd90f73fe7a23fa9b0cf1f3aa1e9647896c3dc2cc26bf8bff8b11bfe9120007fea7d8bd6a5c07de11bc7a179a4d84fec5f761e0ef030f0380bb9032cc63bf5560366db026442bb80323356c3ddbbdb9f0a899b08b0555b9540753fd15dfbf4a4ea5a6535707cf2651f94c3c6029371c4c011412f6fe77a3cd79678fa593fd759634df52fbd3321f6482dd0a50957bb72228d3b9b8f7df2f1bed21bf8c20b049e992255e31a352c151eb394c45ea9ce2b8f73141b18ae683f36f3ada3e685d762c434646eda0c0e2525a1333875230f4606538bcfd8bf00ed047ba1a8ead60cddeca8a6785924391e1eaf7f55ea2936005e0b465b4ddb8f2c52cc00f73b7f509827738d3873db08bff786f100d628b848b73424b1eceb1cbd95d30bbbb2a66be8f51f5df05950f982a459bf955683294a2b49992699ad312e5caeb8fd51be3c2e6fb2a39005e6e57ed11501f04463b4a326fcd09ff33ff30bdb03fe6347feb801e85a749d6ae1eb30aaafa74ee4b7046afb9c39174ef6dbc80dac7cb3aff945ca2c0f3e51026f69affe1839183a9d81000f6c52ffb784ffe21bd3d92001bfac01f71dd2a37e5ee860998731ee8432e02fe6f41265ec1c0d1b5fe13128d41d4bbe65276ac093ca610edf434a06e498bdd17ecdf01da3f2ea418235db5c95fa961f373cf4885d538b6be20c49d727588bd7218f90216a9deb1821a86cfa145f5d751f2173a5400847be60ec2584dd29d623ec873bf08f3975c11f0e563f0fcc7af3a1d20fd3a7b4128c8006dce86b9ce6d56d3fc64641751daf23d636b0e3793cafddb64be63c56ec8d27f03864b92f4229c110dffd06b0bdea11efb8d5f435248e6864d5b44719da10129e6d0479d08f435bda53580cb4bed3432b481d7a4bbe57241ab21a80466d19a776baa2bbf8143dc7c8a0a3c818e327c741254c9159b17f0260c0a2eae5bfa19c0d1a3fd0247e301053b01edf5f3aa2b9ce6ce58f12164b498eb6baaccbe676f2bf932e7ec1657dbd97f734d7fa848e21bd037e7e03ae52b1b94e4aecbb23214a1f386ff52baa1e0007e724c9a201a15946ff4031c847a9f1997a4590b71c80dbc501c19e0715104b493bb634260e7712584e17efe950b97b0308b077fb3a621560fea73f051646ab4f5d2df894fa696a3e63cb18c296948dd3b2266bec727cb7ae1896c80be3fe285c96e5466a54bcac2e782ebe4b037cb3504698bfab9622063885c5916da6c407d03b29f5aee439c9719421550646c0a5dc6f526e00c85da0483e9ea2753dcbc89d5910bfdcc79f2eaa8cda478a443ca5d3872dae73adaae7dbd01edf0eb7d87d148ac173b9c500f01ff0f67c8b8ec6dc33e0e9b78599ef1ec3374f6b0bb6b27b17ed2603b7cd36cf7ec371d347c9fd0b8582e104d333c63286f85cb18d9be361817d8d2bfcc792c78d3125957f5362dad4c0abb17f7e462242bd85853c7b75cbbf4d6182619e54c32ab7e468c0cfcc3f881f174b853cf5987f646574c4dc89cc1c47fba6f637fa7c6e46a47269959cbaeedd7bd235603c6262d43bfe9745f4776083271d624e624605157746836fd8dbfceb58c6e14be2baafb91e90b962a1615ca5e8bfb8d766f3d4096ad84a9c0e080db6115fa22f6cce7112db713eda8a6c23daf738b3dbbd2f1fa04298fd23dfd22993d1965b916fab6048a7541e6f1416976267b954f1641a05da4b1f4194f3ed2f628ca22fc6c9c4f1c4818bfb67d51e3d452c8b45d90bbe66f68ef2c841b47a01df0159b01a57d307ffdc3dee549e290a6d1f05f0d75b1b57ba938d4949e8b406cde9164c20e2348676a3b3d15435541b249684ed1689dbcbe6390d17b09e695a6a682cedbe7991fbac50262b35494e08ee8f6b036593ab7c74e2c0c36f59197e078aa820ef90d6443ab94f2f5fcaf0d326d0011dc48215be07b9d4bbbf30ea3e11b4b73180b41c5690c0fc2850ada27855b96066186a9f959fedb7c2af9c7a3be111d1e0a36f4c1d7f6cfb61fb8550f214b5c3f9ded4a325c2731d5f55d97eaa33ee0525e03db7f454c2601ad81ce6bc008de3515562aacce359a6aede9c7ebafc138092a6a1eb42663c05e9b3b860deee71e6306c94ac8dd2e8d04abc07acec6885d6a31d083492dff3b8b3c1ce122c100c2e7c8fccae53c11043ebcf4deffef8e811de04424c848ffc46256cc60051252665c98059ca1873be53179e13a9aa108d710d017b1ab35b9de8db45eede5bee43bd482dcfb6d1c7c900a7e9921ae7c89462df9d7ea6c4d73a0ef03c82af63eac44a432533bc1b90be2eba34d7d8a41f5eaefcbda6db390ddf067e31738118e930e608bcce5866f05ef2929c183bc65ea4f2c00d68c25cd68f228650e41d07051ef30e329347cd963fd49981221bd2085d0c3bcb746be89d93b4387715914cb18fdc51a41c24c1240cd5c7b17d64f5a2b76ea25d62d3d49c9711b49820a81873965598179cc91ce2efb08ab5dae884381f1e03a529f422c5f93f065109c6e9d482471a7412c0ca347d7f8ddfaf3ddceca090037e49fcc7334def33d1c42f1d97aa004e7923b52d4ea29d9ebc05b83398e8079d7ffd83bdcdfff59b0e92ba142cef0d0270c101cef93a37756e0eb3d2065e618a5ca926a8e13617962735a63ecd4851daaf34eee277ae350fe14e5f330f7f2f70a7f20be9aa44eab7af467d82ef34a0c934545dfe83f6ab35210d183363ae772725fd3a08296efbca071aa73503baaf2025d0e0046989d3ef918d01bdd9d0e3989cba9f9232282de2cee734c81f178bbc50fbab6da903249a8f49f3c4266a1ae80a00dc49e5da7da4492e094a8ceac50d95dcc8b0c727ff83541dc2446093bf0842e8805c8b69a6b08d284f0b4cb7955c0ee38b2ce94906057b8bb09a1cc0be263f9b588b554e0138b64bcb369399ca14e10ce2447f053c44e46b130d38de1d3aa2c0cc030047ba4014136be4426ed8c1d150cf9d7e740db54751616a4abd7a7975d93856e31219c401c6e5ce29ac9e9d07484e45aeead62f942da3ee2b7860f275ee696808b8898c5e3eb38a92ab2dfef210aa49a8df164ff94255cbe193633e5aef31281b4ebc8691ac8e9b04221d0b605fd8dd5f9b5e77dbcf2a8f1f1872b70be47b778561dab375d206e5523353e51f2fe58071062eb387f59401b97c062e198c16207fb9eb2329ee70fe4a2e98458f2c313f3f4fe2f006631c5abdb33804954c189452debf5555adbd827bf6439f5bb843b918032ab62ca22255b59ba1707e2cf54683b7e2225d5e9f89eb45656077f70665629346d26253883302fe87d710adac720de86c45914c15dca171107ef626957ab38a3d6fa65adb67190ddf2bd516fa80b41c66354441942620a06ad2081e2c91573689d76d6002def477b25ac3078db8ac97d26a699d10cb4a959851502d14eff5fdb65e8a403b8ace0435d343b63ef429ca5f53d5fb2395fe3658b0e57c8217c177e50672ab2	69ac66207267ccaa64c79974
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.countries (id, code, name) FROM stdin;
1	AF	Afghanistan
2	AL	Albania
3	DZ	Algeria
4	AS	American Samoa
5	AD	Andorra
6	AO	Angola
7	AI	Anguilla
8	AQ	Antarctica
9	AG	Antigua and Barbuda
10	AR	Argentina
11	AM	Armenia
12	AW	Aruba
13	AU	Australia
14	AT	Austria
15	AZ	Azerbaijan
16	BS	Bahamas
17	BH	Bahrain
18	BD	Bangladesh
19	BB	Barbados
20	BY	Belarus
21	BE	Belgium
22	BZ	Belize
23	BJ	Benin
24	BM	Bermuda
25	BT	Bhutan
26	BO	Bolivia
27	BA	Bosnia and Herzegovina
28	BW	Botswana
29	BV	Bouvet Island
30	BR	Brazil
31	IO	British Indian Ocean Territory
32	BN	Brunei Darussalam
33	BG	Bulgaria
34	BF	Burkina Faso
35	BI	Burundi
36	KH	Cambodia
37	CM	Cameroon
38	CA	Canada
39	CV	Cape Verde
40	KY	Cayman Islands
41	CF	Central African Republic
42	TD	Chad
43	CL	Chile
44	CN	China
45	CX	Christmas Island
46	CC	Cocos (Keeling) Islands
47	CO	Colombia
48	KM	Comoros
49	CG	Congo
50	CD	Congo, the Democratic Republic of the
51	CK	Cook Islands
52	CR	Costa Rica
53	CI	Cote D'Ivoire
54	HR	Croatia
55	CU	Cuba
56	CY	Cyprus
57	CZ	Czech Republic
58	DK	Denmark
59	DJ	Djibouti
60	DM	Dominica
61	DO	Dominican Republic
62	EC	Ecuador
63	EG	Egypt
64	SV	El Salvador
65	GQ	Equatorial Guinea
66	ER	Eritrea
67	EE	Estonia
68	ET	Ethiopia
69	FK	Falkland Islands (Malvinas)
70	FO	Faroe Islands
71	FJ	Fiji
72	FI	Finland
73	FR	France
74	GF	French Guiana
75	PF	French Polynesia
76	TF	French Southern Territories
77	GA	Gabon
78	GM	Gambia
79	GE	Georgia
80	DE	Germany
81	GH	Ghana
82	GI	Gibraltar
83	GR	Greece
84	GL	Greenland
85	GD	Grenada
86	GP	Guadeloupe
87	GU	Guam
88	GT	Guatemala
89	GN	Guinea
90	GW	Guinea-Bissau
91	GY	Guyana
92	HT	Haiti
93	HM	Heard Island and Mcdonald Islands
94	VA	Holy See (Vatican City State)
95	HN	Honduras
96	HK	Hong Kong
97	HU	Hungary
98	IS	Iceland
99	IN	India
100	ID	Indonesia
101	IR	Iran, Islamic Republic of
102	IQ	Iraq
103	IE	Ireland
104	IL	Israel
105	IT	Italy
106	JM	Jamaica
107	JP	Japan
108	JO	Jordan
109	KZ	Kazakhstan
110	KE	Kenya
111	KI	Kiribati
112	KP	Korea, Democratic People's Republic of
113	KR	Korea, Republic of
114	KW	Kuwait
115	KG	Kyrgyzstan
116	LA	Lao People's Democratic Republic
117	LV	Latvia
118	LB	Lebanon
119	LS	Lesotho
120	LR	Liberia
121	LY	Libyan Arab Jamahiriya
122	LI	Liechtenstein
123	LT	Lithuania
124	LU	Luxembourg
125	MO	Macao
126	MK	Macedonia, the Former Yugoslav Republic of
127	MG	Madagascar
128	MW	Malawi
129	MY	Malaysia
130	MV	Maldives
131	ML	Mali
132	MT	Malta
133	MH	Marshall Islands
134	MQ	Martinique
135	MR	Mauritania
136	MU	Mauritius
137	YT	Mayotte
138	MX	Mexico
139	FM	Micronesia, Federated States of
140	MD	Moldova, Republic of
141	MC	Monaco
142	MN	Mongolia
143	MS	Montserrat
144	MA	Morocco
145	MZ	Mozambique
146	MM	Myanmar
147	NA	Namibia
148	NR	Nauru
149	NP	Nepal
150	NL	Netherlands
151	AN	Netherlands Antilles
152	NC	New Caledonia
153	NZ	New Zealand
154	NI	Nicaragua
155	NE	Niger
156	NG	Nigeria
157	NU	Niue
158	NF	Norfolk Island
159	MP	Northern Mariana Islands
160	NO	Norway
161	OM	Oman
162	PK	Pakistan
163	PW	Palau
164	PS	Palestinian Territory, Occupied
165	PA	Panama
166	PG	Papua New Guinea
167	PY	Paraguay
168	PE	Peru
169	PH	Philippines
170	PN	Pitcairn
171	PL	Poland
172	PT	Portugal
173	PR	Puerto Rico
174	QA	Qatar
175	RE	Reunion
176	RO	Romania
177	RU	Russian Federation
178	RW	Rwanda
179	SH	Saint Helena
180	KN	Saint Kitts and Nevis
181	LC	Saint Lucia
182	PM	Saint Pierre and Miquelon
183	VC	Saint Vincent and the Grenadines
184	WS	Samoa
185	SM	San Marino
186	ST	Sao Tome and Principe
187	SA	Saudi Arabia
188	SN	Senegal
189	CS	Serbia and Montenegro
190	SC	Seychelles
191	SL	Sierra Leone
192	SG	Singapore
193	SK	Slovakia
194	SI	Slovenia
195	SB	Solomon Islands
196	SO	Somalia
197	ZA	South Africa
198	GS	South Georgia and the South Sandwich Islands
199	ES	Spain
200	LK	Sri Lanka
201	SD	Sudan
202	SR	Suriname
203	SJ	Svalbard and Jan Mayen
204	SZ	Swaziland
205	SE	Sweden
206	CH	Switzerland
207	SY	Syrian Arab Republic
208	TW	Taiwan, Province of China
209	TJ	Tajikistan
210	TZ	Tanzania, United Republic of
211	TH	Thailand
212	TL	Timor-Leste
213	TG	Togo
214	TK	Tokelau
215	TO	Tonga
216	TT	Trinidad and Tobago
217	TN	Tunisia
218	TR	Turkey
219	TM	Turkmenistan
220	TC	Turks and Caicos Islands
221	TV	Tuvalu
222	UG	Uganda
223	UA	Ukraine
224	AE	United Arab Emirates
225	GB	United Kingdom
226	US	United States
227	UM	United States Minor Outlying Islands
228	UY	Uruguay
229	UZ	Uzbekistan
230	VU	Vanuatu
231	VE	Venezuela
232	VN	Viet Nam
233	VG	Virgin Islands, British
234	VI	Virgin Islands, U.s.
235	WF	Wallis and Futuna
236	EH	Western Sahara
237	YE	Yemen
238	ZM	Zambia
239	ZW	Zimbabwe
\.


--
-- Data for Name: documentation_xml; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.documentation_xml (id, nombre_objeto, tipo_estructura, formato, descripcion, fields_data) FROM stdin;
2	Map_SAP_CFDI_4.1	CFDI	XML	Mapeo estructura XML CFDI usando SAP como ERP ECC como ERP Fuente	{"root": [{"name": "Comprobante", "type": "Inline", "xpath": "/Comprobante", "isLeaf": false, "children": [{"name": "InformacionGlobal", "type": "Inline", "xpath": "/Comprobante/InformacionGlobal", "isLeaf": false, "children": [], "required": "No", "description": "Nodo condicional para precisar la información relacionada con el comprobante global.", "sapStructure": ""}, {"name": "CfdiRelacionados", "type": "Inline", "xpath": "/Comprobante/CfdiRelacionados", "isLeaf": false, "children": [{"name": "CfdiRelacionado", "type": "Inline", "xpath": "/Comprobante/CfdiRelacionados/CfdiRelacionado", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para precisar la información de los comprobantes relacionados.", "sapStructure": ""}], "required": "No", "description": "Nodo opcional para precisar la información de los comprobantes relacionados.", "sapStructure": ""}, {"name": "Emisor", "type": "Inline", "xpath": "/Comprobante/Emisor", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para expresar la información del contribuyente emisor del comprobante.", "sapStructure": ""}, {"name": "Receptor", "type": "Inline", "xpath": "/Comprobante/Receptor", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para precisar la información del contribuyente receptor del comprobante.", "sapStructure": ""}, {"name": "Conceptos", "type": "Inline", "xpath": "/Comprobante/Conceptos", "isLeaf": false, "children": [{"name": "Concepto", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto", "isLeaf": false, "children": [{"name": "Impuestos", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Impuestos", "isLeaf": false, "children": [{"name": "Traslados", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Impuestos/Traslados", "isLeaf": false, "children": [{"name": "Traslado", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Impuestos/Traslados/Traslado", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para asentar la información detallada de un traslado de impuestos aplicable al presente concepto.", "sapStructure": ""}], "required": "No", "description": "Nodo opcional para asentar los impuestos trasladados aplicables al presente concepto.", "sapStructure": ""}, {"name": "Retenciones", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Impuestos/Retenciones", "isLeaf": false, "children": [{"name": "Retencion", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Impuestos/Retenciones/Retencion", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para asentar la información detallada de una retención de impuestos aplicable al presente concepto.", "sapStructure": ""}], "required": "No", "description": "Nodo opcional para asentar los impuestos retenidos aplicables al presente concepto.", "sapStructure": ""}], "required": "No", "description": "Nodo condicional para capturar los impuestos aplicables al presente concepto.", "sapStructure": ""}, {"name": "ACuentaTerceros", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/ACuentaTerceros", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional para registrar información del contribuyente Tercero, a cuenta del que se realiza la operación.", "sapStructure": ""}, {"name": "InformacionAduanera", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/InformacionAduanera", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional para introducir la información aduanera aplicable cuando se trate de ventas de primera mano de mercancías importadas o se trate de operaciones de comercio exterior con bienes o servicios.", "sapStructure": ""}, {"name": "CuentaPredial", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/CuentaPredial", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional para asentar el número de cuenta predial con el que fue registrado el inmueble, en el sistema catastral de la entidad federativa de que trate, o bien para incorporar los datos de identificación del certificado de participación inmobiliaria no amortizable.", "sapStructure": ""}, {"name": "ComplementoConcepto", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/ComplementoConcepto", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional donde se incluyen los nodos complementarios de extensión al concepto definidos por el SAT, de acuerdo con las disposiciones particulares para un sector o actividad específica.", "sapStructure": ""}, {"name": "Parte", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Parte", "isLeaf": false, "children": [{"name": "InformacionAduanera", "type": "Inline", "xpath": "/Comprobante/Conceptos/Concepto/Parte/InformacionAduanera", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional para introducir la información aduanera aplicable cuando se trate de ventas de primera mano de mercancías importadas o se trate de operaciones de comercio exterior con bienes o servicios.", "sapStructure": ""}], "required": "No", "description": "Nodo opcional para expresar las partes o componentes que integran la totalidad del concepto expresado en el comprobante fiscal digital por Internet.", "sapStructure": ""}], "required": "Yes", "description": "Nodo requerido para registrar la información detallada de un bien o servicio amparado en el comprobante.", "sapStructure": ""}], "required": "Yes", "description": "Nodo requerido para listar los conceptos cubiertos por el comprobante.", "sapStructure": ""}, {"name": "Impuestos", "type": "Inline", "xpath": "/Comprobante/Impuestos", "isLeaf": false, "children": [{"name": "Retenciones", "type": "Inline", "xpath": "/Comprobante/Impuestos/Retenciones", "isLeaf": false, "children": [{"name": "Retencion", "type": "Inline", "xpath": "/Comprobante/Impuestos/Retenciones/Retencion", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para la información detallada de una retención de impuesto específico.", "sapStructure": ""}], "required": "No", "description": "Nodo condicional para capturar los impuestos retenidos aplicables. Es requerido cuando en los conceptos se registre algún impuesto retenido.", "sapStructure": ""}, {"name": "Traslados", "type": "Inline", "xpath": "/Comprobante/Impuestos/Traslados", "isLeaf": false, "children": [{"name": "Traslado", "type": "Inline", "xpath": "/Comprobante/Impuestos/Traslados/Traslado", "isLeaf": false, "children": [], "required": "Yes", "description": "Nodo requerido para la información detallada de un traslado de impuesto específico.", "sapStructure": ""}], "required": "No", "description": "Nodo condicional para capturar los impuestos trasladados aplicables. Es requerido cuando en los conceptos se registre un impuesto trasladado.", "sapStructure": ""}], "required": "No", "description": "Nodo condicional para expresar el resumen de los impuestos aplicables.", "sapStructure": ""}, {"name": "Complemento", "type": "Inline", "xpath": "/Comprobante/Complemento", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional donde se incluye el complemento Timbre Fiscal Digital de manera obligatoria y los nodos complementarios determinados por el SAT, de acuerdo con las disposiciones particulares para un sector o actividad específica.", "sapStructure": ""}, {"name": "Addenda", "type": "Inline", "xpath": "/Comprobante/Addenda", "isLeaf": false, "children": [], "required": "No", "description": "Nodo opcional para recibir las extensiones al presente formato que sean de utilidad al contribuyente. Para las reglas de uso del mismo, referirse al formato origen.", "sapStructure": ""}], "required": "Yes", "description": "Estándar de Comprobante Fiscal Digital por Internet.", "sapStructure": ""}]}
3	Map_SAP_UBL_Invo01	UBL 2.1	XML	Mapeo factura logística SD UBL 2.1 Francia	\N
1	Map_SAP_UBL_Invoice	UBL 2.1	XML	Representación de el mapeo de una estructura UBL mensaje Invoice con las tablas SD / FI de SAP	{"root": [{"name": "Facturae", "type": "Inline", "xpath": "/Facturae", "isLeaf": false, "children": [{"name": "FileHeader", "type": "FileHeaderType", "xpath": "/Facturae/FileHeader", "isLeaf": false, "children": [{"name": "SchemaVersion", "type": "SchemaVersionType", "xpath": "/Facturae/FileHeader/SchemaVersion", "isLeaf": true, "children": [], "required": "Yes", "description": "Código que indica versión utilizada.", "sapStructure": "3.2.1"}, {"name": "Modality", "type": "ModalityType", "xpath": "/Facturae/FileHeader/Modality", "isLeaf": true, "children": [], "required": "Yes", "description": "Modalidad. Individual o Lote. Si es \\"individual\\" (I) los importes de los campos del grupo Batch coincidirán con sus correspondientes campos del grupo InvoiceTotals y el campo InvoicesCount tendrá siempre el valor \\"1\\". Si es \\"lote\\" (L), el valor del campo InvoicesCount será siempre > \\"1\\".", "sapStructure": "I"}, {"name": "InvoiceIssuerType", "type": "InvoiceIssuerTypeType", "xpath": "/Facturae/FileHeader/InvoiceIssuerType", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo Emisor Factura. Puede tomar 3 valores (EM, RE y TE), que se describen como “Proveedor (antes denominado emisor)”, “Destinatario (antes denominado cliente o receptor)” y “Tercero”, respectivamente. Si toma el valor \\"TE\\" el grupo ThirdParty será obligatorio cumplimentarlo en todos sus apartados.", "sapStructure": ""}, {"name": "ThirdParty", "type": "ThirdPartyType", "xpath": "/Facturae/FileHeader/ThirdParty", "isLeaf": false, "children": [{"name": "TaxIdentification", "type": "TaxIdentificationType", "xpath": "/Facturae/FileHeader/ThirdParty/TaxIdentification", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/FileHeader/ThirdParty/TaxIdentification/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": ""}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/FileHeader/ThirdParty/TaxIdentification/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": ""}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/FileHeader/ThirdParty/TaxIdentification/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": ""}], "required": "Yes", "description": "Identificación fiscal.", "sapStructure": ""}, {"name": "LegalEntity", "type": "LegalEntityType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity", "isLeaf": false, "children": [{"name": "CorporateName", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/CorporateName", "isLeaf": true, "children": [], "required": "Yes", "description": "Razón Social.", "sapStructure": ""}, {"name": "TradeName", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/TradeName", "isLeaf": true, "children": [], "required": "No", "description": "Nombre Comercial.", "sapStructure": ""}, {"name": "RegistrationData", "type": "RegistrationDataType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData", "isLeaf": false, "children": [{"name": "Book", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/Book", "isLeaf": true, "children": [], "required": "No", "description": "Libro.", "sapStructure": ""}, {"name": "RegisterOfCompaniesLocation", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/RegisterOfCompaniesLocation", "isLeaf": true, "children": [], "required": "No", "description": "Registro Mercantil.", "sapStructure": ""}, {"name": "Sheet", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/Sheet", "isLeaf": true, "children": [], "required": "No", "description": "Hoja.", "sapStructure": ""}, {"name": "Folio", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/Folio", "isLeaf": true, "children": [], "required": "No", "description": "Folio.", "sapStructure": ""}, {"name": "Section", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/Section", "isLeaf": true, "children": [], "required": "No", "description": "Sección.", "sapStructure": ""}, {"name": "Volume", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/Volume", "isLeaf": true, "children": [], "required": "No", "description": "Tomo.", "sapStructure": ""}, {"name": "AdditionalRegistrationData", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/RegistrationData/AdditionalRegistrationData", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos registrales.", "sapStructure": ""}], "required": "No", "description": "Datos Registrales: Inscripción Registro, Tomo, Folio,…", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección Nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/LegalEntity/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona jurídica y otras.", "sapStructure": ""}, {"name": "Individual", "type": "IndividualType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual", "isLeaf": false, "children": [{"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/Name", "isLeaf": true, "children": [], "required": "Yes", "description": "Nombre de la persona física.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/FirstSurname", "isLeaf": true, "children": [], "required": "Yes", "description": "Primer apellido de la persona física.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona física.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/ThirdParty/Individual/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona física.", "sapStructure": ""}], "required": "No", "description": "Tercero. La factura puede ser generada y firmada por un Tercero.", "sapStructure": ""}, {"name": "Batch", "type": "BatchType", "xpath": "/Facturae/FileHeader/Batch", "isLeaf": false, "children": [{"name": "BatchIdentifier", "type": "TextMax70Type", "xpath": "/Facturae/FileHeader/Batch/BatchIdentifier", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificador del lote. Concatenación del nº de documento del emisor con el número de la primera factura y el número de serie caso de existir.", "sapStructure": ""}, {"name": "InvoicesCount", "type": "xs:long", "xpath": "/Facturae/FileHeader/Batch/InvoicesCount", "isLeaf": true, "children": [], "required": "Yes", "description": "Número total de facturas. Refleja, cuando es lote, el número de facturas del mismo. Siempre será valor \\"1\\" cuando el campo Modality (Modalidad) tenga el valor \\"I\\".", "sapStructure": ""}, {"name": "TotalInvoicesAmount", "type": "AmountType", "xpath": "/Facturae/FileHeader/Batch/TotalInvoicesAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalInvoicesAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalInvoicesAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Total facturas. Suma de los importes InvoiceTotal del Fichero. Este importe lo es a efectos de total de factura y fiscales, sin tener en cuenta subvenciones, anticipos y/o retenciones que pudieran haberse practicado.", "sapStructure": ""}, {"name": "TotalOutstandingAmount", "type": "AmountType", "xpath": "/Facturae/FileHeader/Batch/TotalOutstandingAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalOutstandingAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalOutstandingAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Total a pagar. Suma de los importes TotalOutstandingAmount del Fichero, hasta ocho decimales. Es el importe que efectivamente se adeuda, una vez descontados los anticipos y sin tener en cuenta las retenciones.", "sapStructure": ""}, {"name": "TotalExecutableAmount", "type": "AmountType", "xpath": "/Facturae/FileHeader/Batch/TotalExecutableAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalExecutableAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/FileHeader/Batch/TotalExecutableAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Total a Ejecutar. Sumatorio de los Importes TotalExecutableAmount, hasta ocho decimales.", "sapStructure": ""}, {"name": "InvoiceCurrencyCode", "type": "CurrencyCodeType", "xpath": "/Facturae/FileHeader/Batch/InvoiceCurrencyCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código ISO 4217:2001 Alpha-3 de la moneda en la que se emite la factura. Si difiere de la moneda EURO o del campo ExchangeRateDetails será obligatorio indicar el contravalor y el tipo/fecha de cambio para los campos de base imponible y cuota, retenida como repercutida, así como en los totales TotalInvoicesAmount, TotalOutstandingAmount, y TotalExecutableAmount.", "sapStructure": ""}], "required": "Yes", "description": "Lote.", "sapStructure": ""}, {"name": "FactoringAssignmentData", "type": "FactoringAssignmentDataType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData", "isLeaf": false, "children": [{"name": "Assignee", "type": "AssigneeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee", "isLeaf": false, "children": [{"name": "TaxIdentification", "type": "TaxIdentificationType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/TaxIdentification", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/TaxIdentification/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": ""}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/TaxIdentification/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": ""}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/TaxIdentification/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": ""}], "required": "Yes", "description": "Identificación fiscal.", "sapStructure": ""}, {"name": "LegalEntity", "type": "LegalEntityType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity", "isLeaf": false, "children": [{"name": "CorporateName", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/CorporateName", "isLeaf": true, "children": [], "required": "Yes", "description": "Razón Social.", "sapStructure": ""}, {"name": "TradeName", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/TradeName", "isLeaf": true, "children": [], "required": "No", "description": "Nombre Comercial.", "sapStructure": ""}, {"name": "RegistrationData", "type": "RegistrationDataType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData", "isLeaf": false, "children": [{"name": "Book", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/Book", "isLeaf": true, "children": [], "required": "No", "description": "Libro.", "sapStructure": ""}, {"name": "RegisterOfCompaniesLocation", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/RegisterOfCompaniesLocation", "isLeaf": true, "children": [], "required": "No", "description": "Registro Mercantil.", "sapStructure": ""}, {"name": "Sheet", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/Sheet", "isLeaf": true, "children": [], "required": "No", "description": "Hoja.", "sapStructure": ""}, {"name": "Folio", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/Folio", "isLeaf": true, "children": [], "required": "No", "description": "Folio.", "sapStructure": ""}, {"name": "Section", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/Section", "isLeaf": true, "children": [], "required": "No", "description": "Sección.", "sapStructure": ""}, {"name": "Volume", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/Volume", "isLeaf": true, "children": [], "required": "No", "description": "Tomo.", "sapStructure": ""}, {"name": "AdditionalRegistrationData", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/RegistrationData/AdditionalRegistrationData", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos registrales.", "sapStructure": ""}], "required": "No", "description": "Datos Registrales: Inscripción Registro, Tomo, Folio,…", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección Nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/LegalEntity/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona jurídica y otras.", "sapStructure": ""}, {"name": "Individual", "type": "IndividualType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual", "isLeaf": false, "children": [{"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/Name", "isLeaf": true, "children": [], "required": "Yes", "description": "Nombre de la persona física.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/FirstSurname", "isLeaf": true, "children": [], "required": "Yes", "description": "Primer apellido de la persona física.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona física.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/Assignee/Individual/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona física.", "sapStructure": ""}], "required": "Yes", "description": "Cesionario.", "sapStructure": ""}, {"name": "PaymentDetails", "type": "InstallmentsType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails", "isLeaf": false, "children": [{"name": "Installment", "type": "InstallmentType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment", "isLeaf": false, "children": [{"name": "InstallmentDueDate", "type": "xs:date", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/InstallmentDueDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fechas en las que se deben atender los pagos. ISO 8601:2004.", "sapStructure": ""}, {"name": "InstallmentAmount", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/InstallmentAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a satisfacer en cada plazo. Siempre con dos decimales.", "sapStructure": ""}, {"name": "PaymentMeans", "type": "PaymentMeansType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/PaymentMeans", "isLeaf": true, "children": [], "required": "Yes", "description": "Cada vencimiento/importe podrá tener un medio de pago concreto.", "sapStructure": ""}, {"name": "AccountToBeCredited", "type": "AccountType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited", "isLeaf": false, "children": [{"name": "IBAN", "type": "TextMin5Max34Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/IBAN", "isLeaf": true, "children": [], "required": "Yes", "description": "IBAN. Único formato admitido para identificar la cuenta. (Recomendado)", "sapStructure": ""}, {"name": "AccountNumber", "type": "TextMin5Max34Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/AccountNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Número de cuenta.", "sapStructure": ""}, {"name": "BankCode", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BankCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la entidad financiera.", "sapStructure": ""}, {"name": "BranchCode", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la oficina de la entidad financiera.", "sapStructure": ""}, {"name": "BranchInSpainAddress", "type": "AddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en España.", "sapStructure": ""}, {"name": "OverseasBranchAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en el extranjero.", "sapStructure": ""}, {"name": "BIC", "type": "BICType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeCredited/BIC", "isLeaf": true, "children": [], "required": "No", "description": "Código SWIFT. Será obligatorio rellenar las 11 posiciones, utilizando los caracteres XXX cuando no se informe de la sucursal.", "sapStructure": ""}], "required": "No", "description": "Cuenta de abono. Único formato admitido. Cuando la forma de pago (PaymentMeans) sea \\"transferencia\\" este dato será obligatorio.", "sapStructure": ""}, {"name": "PaymentReconciliationReference", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/PaymentReconciliationReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia expresa del pago. Dato que precisa el Emisor para conciliar los pagos con cada factura.", "sapStructure": ""}, {"name": "AccountToBeDebited", "type": "AccountType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited", "isLeaf": false, "children": [{"name": "IBAN", "type": "TextMin5Max34Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/IBAN", "isLeaf": true, "children": [], "required": "Yes", "description": "IBAN. Único formato admitido para identificar la cuenta. (Recomendado)", "sapStructure": ""}, {"name": "AccountNumber", "type": "TextMin5Max34Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/AccountNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Número de cuenta.", "sapStructure": ""}, {"name": "BankCode", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BankCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la entidad financiera.", "sapStructure": ""}, {"name": "BranchCode", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la oficina de la entidad financiera.", "sapStructure": ""}, {"name": "BranchInSpainAddress", "type": "AddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en España.", "sapStructure": ""}, {"name": "OverseasBranchAddress", "type": "OverseasAddressType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en el extranjero.", "sapStructure": ""}, {"name": "BIC", "type": "BICType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/AccountToBeDebited/BIC", "isLeaf": true, "children": [], "required": "No", "description": "Código SWIFT. Será obligatorio rellenar las 11 posiciones, utilizando los caracteres XXX cuando no se informe de la sucursal.", "sapStructure": ""}], "required": "No", "description": "Cuenta de cargo. Único formato admitido. Cuando la forma de pago (PaymentMeans) sea \\"recibo domiciliado\\" este dato será obligatorio.", "sapStructure": ""}, {"name": "CollectionAdditionalInformation", "type": "TextMax2500Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/CollectionAdditionalInformation", "isLeaf": true, "children": [], "required": "No", "description": "Observaciones de cobro. Libre para uso del Emisor.", "sapStructure": ""}, {"name": "RegulatoryReportingData", "type": "RegulatoryReportingDataType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/RegulatoryReportingData", "isLeaf": true, "children": [], "required": "No", "description": "Código Estadístico. Usado en las operaciones transfronterizas según las especificaciones de la circular del Banco España 15/1992", "sapStructure": ""}, {"name": "DebitReconciliationReference", "type": "TextMax60Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/PaymentDetails/Installment/DebitReconciliationReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del cliente pagador, similar a la utilizada por elemisor para la conciliación de los pagos.", "sapStructure": ""}], "required": "Yes", "description": "Vencimiento.", "sapStructure": ""}], "required": "Yes", "description": "Datos de pago.", "sapStructure": ""}, {"name": "FactoringAssignmentClauses", "type": "TextMax2500Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentClauses", "isLeaf": true, "children": [], "required": "Yes", "description": "Texto de la cláusula de cesión.", "sapStructure": ""}, {"name": "FactoringAssignmentDocument", "type": "FactoringAssignmentDocumentType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument", "isLeaf": false, "children": [{"name": "DocumentCharacter", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/DocumentCharacter", "isLeaf": true, "children": [], "required": "Yes", "description": "Naturaleza del documento. Posibles valores: acuerdo de cesión, poder acreditativo de representación, otros", "sapStructure": ""}, {"name": "RepresentationIdentity", "type": "TextMax80Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/RepresentationIdentity", "isLeaf": true, "children": [], "required": "No", "description": "Es obligatorio en el caso de que el valor de DocumentCharacter sea \\"poder acreditativo de representación\\". Posibles valores: del cedente en el acuerdo de cesión, del cesionario en el acuerdo de cesión, de quien efectúa la notificación en nombre de cedente o cesionario.", "sapStructure": ""}, {"name": "DocumentType", "type": "TextMax50Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/DocumentType", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de documento. Posibles valores: escritura pública, documento privado", "sapStructure": ""}, {"name": "Repository", "type": "RepositoryType", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/Repository", "isLeaf": false, "children": [{"name": "RepositoryName", "type": "TextMax20Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/Repository/RepositoryName", "isLeaf": true, "children": [], "required": "Yes", "description": "Archivo electrónico en el que estuviera anotado el factoring. Posibles valores: CGN, ROLECE, REA, otros", "sapStructure": ""}, {"name": "URL", "type": "TextMax250Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/Repository/URL", "isLeaf": true, "children": [], "required": "No", "description": "URL del archivo electrónico no definido. Es obligatorio en el caso de que el valor de RepositoryName sea \\"otros\\"", "sapStructure": ""}, {"name": "Reference", "type": "TextMax250Type", "xpath": "/Facturae/FileHeader/FactoringAssignmentData/FactoringAssignmentDocument/Repository/Reference", "isLeaf": true, "children": [], "required": "Yes", "description": "Referencia electrónica o código de verificación en el archivo electrónico", "sapStructure": ""}], "required": "No", "description": "Datos del archivo electrónico usado", "sapStructure": ""}], "required": "No", "description": "Datos para identificar la referencia electrónica de los documentos de cesión.", "sapStructure": ""}], "required": "No", "description": "Datos cesión factoring.", "sapStructure": ""}], "required": "Yes", "description": "Cabecera del fichero xml", "sapStructure": ""}, {"name": "Parties", "type": "PartiesType", "xpath": "/Facturae/Parties", "isLeaf": false, "children": [{"name": "SellerParty", "type": "BusinessType", "xpath": "/Facturae/Parties/SellerParty", "isLeaf": false, "children": [{"name": "TaxIdentification", "type": "TaxIdentificationType", "xpath": "/Facturae/Parties/SellerParty/TaxIdentification", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/Parties/SellerParty/TaxIdentification/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": "BUT000-TYPE (Category: 1 for 'F', 2 for 'J')"}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/Parties/SellerParty/TaxIdentification/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": "KNA1-LAND1"}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/Parties/SellerParty/TaxIdentification/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": "STCEG"}], "required": "Yes", "description": "Identificación fiscal.", "sapStructure": ""}, {"name": "PartyIdentification", "type": "PartyIdentificationType", "xpath": "/Facturae/Parties/SellerParty/PartyIdentification", "isLeaf": true, "children": [], "required": "No", "description": "Identificación de la entidad; Rellenar con el número de referencia de la entidad del programa de facturación que utilice.", "sapStructure": ""}, {"name": "AdministrativeCentres", "type": "AdministrativeCentresType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres", "isLeaf": false, "children": [{"name": "AdministrativeCentre", "type": "AdministrativeCentreType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre", "isLeaf": false, "children": [{"name": "CentreCode", "type": "TextMax10Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/CentreCode", "isLeaf": true, "children": [], "required": "No", "description": "Número del Departamento Emisor.", "sapStructure": ""}, {"name": "RoleTypeCode", "type": "RoleTypeCodeType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/RoleTypeCode", "isLeaf": true, "children": [], "required": "No", "description": "Tipo rol. Indica la función de un Punto Operacional (P.O.) definido como Centro/Departamento. Estas funciones son: \\"Receptor\\" - Centro del NIF receptor destinatario de la factura. \\"Pagador\\" - Centro del NIF receptor responsable de pagar la factura. \\"Comprador\\" - Centro del NIF receptor que emitió el pedido. \\"Cobrador\\" - Centro del NIF emisor responsable de gestionar el cobro. \\"Fiscal\\" - Centro del NIF receptor de las facturas, cuando un P.O. buzón es compartido por varias empresas clientes con diferentes NIF.s y es necesario diferenciar el receptor del mensaje (buzón común) del lugar donde debe depositarse (empresa destinataria).", "sapStructure": ""}, {"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/Name", "isLeaf": true, "children": [], "required": "No", "description": "Nombre de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/FirstSurname", "isLeaf": true, "children": [], "required": "No", "description": "Primer apellido de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}, {"name": "PhysicalGLN", "type": "TextMax14Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/PhysicalGLN", "isLeaf": true, "children": [], "required": "No", "description": "GLN Físico. Identificación del punto de conexión a la VAN EDI (Global Location Number). Código de barras de 13 posiciones estándar. Valores registrados por AECOC. Recoge el código de País (2p) España es \\"84\\" + Empresa (5p) + los restantes - el último es el producto + dígito de control.", "sapStructure": ""}, {"name": "LogicalOperationalPoint", "type": "TextMax14Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/LogicalOperationalPoint", "isLeaf": true, "children": [], "required": "No", "description": "Punto Lógico Operacional. Código identificativo de la Empresa. Código de barras de 13 posiciones estándar. Valores registrados por AECOC. Recoge el código de País (2p) España es \\"84\\" + Empresa (5p) + los restantes - el último es el producto + dígito de control.", "sapStructure": ""}, {"name": "CentreDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Parties/SellerParty/AdministrativeCentres/AdministrativeCentre/CentreDescription", "isLeaf": true, "children": [], "required": "No", "description": "Descripción del centro.", "sapStructure": ""}], "required": "Yes", "description": "Centro.", "sapStructure": ""}], "required": "No", "description": "Centros.", "sapStructure": ""}, {"name": "LegalEntity", "type": "LegalEntityType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity", "isLeaf": false, "children": [{"name": "CorporateName", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/CorporateName", "isLeaf": true, "children": [], "required": "Yes", "description": "Razón Social.", "sapStructure": ""}, {"name": "TradeName", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/TradeName", "isLeaf": true, "children": [], "required": "No", "description": "Nombre Comercial.", "sapStructure": ""}, {"name": "RegistrationData", "type": "RegistrationDataType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData", "isLeaf": false, "children": [{"name": "Book", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/Book", "isLeaf": true, "children": [], "required": "No", "description": "Libro.", "sapStructure": ""}, {"name": "RegisterOfCompaniesLocation", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/RegisterOfCompaniesLocation", "isLeaf": true, "children": [], "required": "No", "description": "Registro Mercantil.", "sapStructure": ""}, {"name": "Sheet", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/Sheet", "isLeaf": true, "children": [], "required": "No", "description": "Hoja.", "sapStructure": ""}, {"name": "Folio", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/Folio", "isLeaf": true, "children": [], "required": "No", "description": "Folio.", "sapStructure": ""}, {"name": "Section", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/Section", "isLeaf": true, "children": [], "required": "No", "description": "Sección.", "sapStructure": ""}, {"name": "Volume", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/Volume", "isLeaf": true, "children": [], "required": "No", "description": "Tomo.", "sapStructure": ""}, {"name": "AdditionalRegistrationData", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/RegistrationData/AdditionalRegistrationData", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos registrales.", "sapStructure": ""}], "required": "No", "description": "Datos Registrales: Inscripción Registro, Tomo, Folio,…", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección Nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/LegalEntity/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona jurídica y otras.", "sapStructure": ""}, {"name": "Individual", "type": "IndividualType", "xpath": "/Facturae/Parties/SellerParty/Individual", "isLeaf": false, "children": [{"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/Individual/Name", "isLeaf": true, "children": [], "required": "Yes", "description": "Nombre de la persona física.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/Individual/FirstSurname", "isLeaf": true, "children": [], "required": "Yes", "description": "Primer apellido de la persona física.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/Individual/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona física.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/Individual/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/SellerParty/Individual/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/SellerParty/Individual/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/SellerParty/Individual/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/SellerParty/Individual/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/SellerParty/Individual/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/SellerParty/Individual/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona física.", "sapStructure": ""}], "required": "Yes", "description": "Emisor. Datos básicos del fichero. Son comunes a la factura o facturas que se incluyen.", "sapStructure": ""}, {"name": "BuyerParty", "type": "BusinessType", "xpath": "/Facturae/Parties/BuyerParty", "isLeaf": false, "children": [{"name": "TaxIdentification", "type": "TaxIdentificationType", "xpath": "/Facturae/Parties/BuyerParty/TaxIdentification", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/Parties/BuyerParty/TaxIdentification/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": ""}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/Parties/BuyerParty/TaxIdentification/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": ""}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/Parties/BuyerParty/TaxIdentification/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": ""}], "required": "Yes", "description": "Identificación fiscal.", "sapStructure": ""}, {"name": "PartyIdentification", "type": "PartyIdentificationType", "xpath": "/Facturae/Parties/BuyerParty/PartyIdentification", "isLeaf": true, "children": [], "required": "No", "description": "Identificación de la entidad; Rellenar con el número de referencia de la entidad del programa de facturación que utilice.", "sapStructure": ""}, {"name": "AdministrativeCentres", "type": "AdministrativeCentresType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres", "isLeaf": false, "children": [{"name": "AdministrativeCentre", "type": "AdministrativeCentreType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre", "isLeaf": false, "children": [{"name": "CentreCode", "type": "TextMax10Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/CentreCode", "isLeaf": true, "children": [], "required": "No", "description": "Número del Departamento Emisor.", "sapStructure": ""}, {"name": "RoleTypeCode", "type": "RoleTypeCodeType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/RoleTypeCode", "isLeaf": true, "children": [], "required": "No", "description": "Tipo rol. Indica la función de un Punto Operacional (P.O.) definido como Centro/Departamento. Estas funciones son: \\"Receptor\\" - Centro del NIF receptor destinatario de la factura. \\"Pagador\\" - Centro del NIF receptor responsable de pagar la factura. \\"Comprador\\" - Centro del NIF receptor que emitió el pedido. \\"Cobrador\\" - Centro del NIF emisor responsable de gestionar el cobro. \\"Fiscal\\" - Centro del NIF receptor de las facturas, cuando un P.O. buzón es compartido por varias empresas clientes con diferentes NIF.s y es necesario diferenciar el receptor del mensaje (buzón común) del lugar donde debe depositarse (empresa destinataria).", "sapStructure": ""}, {"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/Name", "isLeaf": true, "children": [], "required": "No", "description": "Nombre de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/FirstSurname", "isLeaf": true, "children": [], "required": "No", "description": "Primer apellido de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona responsable o de relación del centro.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}, {"name": "PhysicalGLN", "type": "TextMax14Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/PhysicalGLN", "isLeaf": true, "children": [], "required": "No", "description": "GLN Físico. Identificación del punto de conexión a la VAN EDI (Global Location Number). Código de barras de 13 posiciones estándar. Valores registrados por AECOC. Recoge el código de País (2p) España es \\"84\\" + Empresa (5p) + los restantes - el último es el producto + dígito de control.", "sapStructure": ""}, {"name": "LogicalOperationalPoint", "type": "TextMax14Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/LogicalOperationalPoint", "isLeaf": true, "children": [], "required": "No", "description": "Punto Lógico Operacional. Código identificativo de la Empresa. Código de barras de 13 posiciones estándar. Valores registrados por AECOC. Recoge el código de País (2p) España es \\"84\\" + Empresa (5p) + los restantes - el último es el producto + dígito de control.", "sapStructure": ""}, {"name": "CentreDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Parties/BuyerParty/AdministrativeCentres/AdministrativeCentre/CentreDescription", "isLeaf": true, "children": [], "required": "No", "description": "Descripción del centro.", "sapStructure": ""}], "required": "Yes", "description": "Centro.", "sapStructure": ""}], "required": "No", "description": "Centros.", "sapStructure": ""}, {"name": "LegalEntity", "type": "LegalEntityType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity", "isLeaf": false, "children": [{"name": "CorporateName", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/CorporateName", "isLeaf": true, "children": [], "required": "Yes", "description": "Razón Social.", "sapStructure": ""}, {"name": "TradeName", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/TradeName", "isLeaf": true, "children": [], "required": "No", "description": "Nombre Comercial.", "sapStructure": ""}, {"name": "RegistrationData", "type": "RegistrationDataType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData", "isLeaf": false, "children": [{"name": "Book", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/Book", "isLeaf": true, "children": [], "required": "No", "description": "Libro.", "sapStructure": ""}, {"name": "RegisterOfCompaniesLocation", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/RegisterOfCompaniesLocation", "isLeaf": true, "children": [], "required": "No", "description": "Registro Mercantil.", "sapStructure": ""}, {"name": "Sheet", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/Sheet", "isLeaf": true, "children": [], "required": "No", "description": "Hoja.", "sapStructure": ""}, {"name": "Folio", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/Folio", "isLeaf": true, "children": [], "required": "No", "description": "Folio.", "sapStructure": ""}, {"name": "Section", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/Section", "isLeaf": true, "children": [], "required": "No", "description": "Sección.", "sapStructure": ""}, {"name": "Volume", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/Volume", "isLeaf": true, "children": [], "required": "No", "description": "Tomo.", "sapStructure": ""}, {"name": "AdditionalRegistrationData", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/RegistrationData/AdditionalRegistrationData", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos registrales.", "sapStructure": ""}], "required": "No", "description": "Datos Registrales: Inscripción Registro, Tomo, Folio,…", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección Nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/LegalEntity/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona jurídica y otras.", "sapStructure": ""}, {"name": "Individual", "type": "IndividualType", "xpath": "/Facturae/Parties/BuyerParty/Individual", "isLeaf": false, "children": [{"name": "Name", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/Name", "isLeaf": true, "children": [], "required": "Yes", "description": "Nombre de la persona física.", "sapStructure": ""}, {"name": "FirstSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/FirstSurname", "isLeaf": true, "children": [], "required": "Yes", "description": "Primer apellido de la persona física.", "sapStructure": ""}, {"name": "SecondSurname", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/SecondSurname", "isLeaf": true, "children": [], "required": "No", "description": "Segundo apellido de la persona física.", "sapStructure": ""}, {"name": "AddressInSpain", "type": "AddressType", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/Individual/AddressInSpain/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "Yes", "description": "Dirección nacional. Dirección en España.", "sapStructure": ""}, {"name": "OverseasAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Parties/BuyerParty/Individual/OverseasAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/OverseasAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/OverseasAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/OverseasAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Parties/BuyerParty/Individual/OverseasAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "Yes", "description": "Dirección en el extranjero.", "sapStructure": ""}, {"name": "ContactDetails", "type": "ContactDetailsType", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails", "isLeaf": false, "children": [{"name": "Telephone", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/Telephone", "isLeaf": true, "children": [], "required": "No", "description": "Teléfono. Número de teléfono completo con prefijos del país.", "sapStructure": ""}, {"name": "TeleFax", "type": "TextMax15Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/TeleFax", "isLeaf": true, "children": [], "required": "No", "description": "Fax. Número de fax completo con prefijos del país.", "sapStructure": ""}, {"name": "WebAddress", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/WebAddress", "isLeaf": true, "children": [], "required": "No", "description": "Página web. URL de la dirección de Internet.", "sapStructure": ""}, {"name": "ElectronicMail", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/ElectronicMail", "isLeaf": true, "children": [], "required": "No", "description": "Correo electrónico. Dirección de correo electrónico.", "sapStructure": ""}, {"name": "ContactPersons", "type": "TextMax40Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/ContactPersons", "isLeaf": true, "children": [], "required": "No", "description": "Contactos. Apellidos y Nombre/Razón Social.", "sapStructure": ""}, {"name": "CnoCnae", "type": "CnoCnaeType", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/CnoCnae", "isLeaf": true, "children": [], "required": "No", "description": "CNO/CNAE. Código Asignado por el INE.", "sapStructure": ""}, {"name": "INETownCode", "type": "TextMax9Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/INETownCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de población asignado por el INE.", "sapStructure": ""}, {"name": "AdditionalContactDetails", "type": "TextMax60Type", "xpath": "/Facturae/Parties/BuyerParty/Individual/ContactDetails/AdditionalContactDetails", "isLeaf": true, "children": [], "required": "No", "description": "Otros datos de contacto.", "sapStructure": ""}], "required": "No", "description": "Datos de contacto.", "sapStructure": ""}], "required": "Yes", "description": "Persona física.", "sapStructure": ""}], "required": "Yes", "description": "Receptor. Datos básicos del fichero. Son comunes a la factura o facturas que se incluyen.", "sapStructure": ""}], "required": "Yes", "description": "Sujetos - Datos del emisor y receptor de la factura", "sapStructure": ""}, {"name": "Invoices", "type": "InvoicesType", "xpath": "/Facturae/Invoices", "isLeaf": false, "children": [{"name": "Invoice", "type": "InvoiceType", "xpath": "/Facturae/Invoices/Invoice", "isLeaf": false, "children": [{"name": "InvoiceHeader", "type": "InvoiceHeaderType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader", "isLeaf": false, "children": [{"name": "InvoiceNumber", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/InvoiceNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Número de factura. Número asignado por el Emisor.", "sapStructure": ""}, {"name": "InvoiceSeriesCode", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/InvoiceSeriesCode", "isLeaf": true, "children": [], "required": "No", "description": "Número de serie asignado por el Emisor.", "sapStructure": ""}, {"name": "InvoiceDocumentType", "type": "InvoiceDocumentTypeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/InvoiceDocumentType", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo documento factura. Puede tomar 3 valores (FC, FA y AF), que se describen como “Factura completa u ordinaria”, “Factura simplificada” y “Código sin uso desde la entrada en vigor del RD 1789/2010. Se mantiene por compatibilidad hacia atrás. Antes significaba autofactura. Para indicar que se trata de una factura expedida por el destinatario, se recomienda emplear el elemento InvoiceIssuerType empleando el valor RE, que significa Destinatario”, respectivamente.", "sapStructure": ""}, {"name": "InvoiceClass", "type": "InvoiceClassType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/InvoiceClass", "isLeaf": true, "children": [], "required": "Yes", "description": "Clase de Factura. Puede tomar 6 valores (OO, OR, OC, CO, CR y CC), que se describen como “Original”, “Original rectificativa”, “Original recapitulativa”, “Duplicado original”, “Duplicado rectificativa” y “Duplicado recapitulativa”.", "sapStructure": ""}, {"name": "Corrective", "type": "CorrectiveType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective", "isLeaf": false, "children": [{"name": "InvoiceNumber", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/InvoiceNumber", "isLeaf": true, "children": [], "required": "No", "description": "Número de la factura que se rectifica. Será obligatorio cuando el dato \\"CorrectionMethod\\" (Código del criterio de la rectificación) sea \\"01\\" o \\"02\\".", "sapStructure": ""}, {"name": "InvoiceSeriesCode", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/InvoiceSeriesCode", "isLeaf": true, "children": [], "required": "No", "description": "Número de serie de la factura que se rectifica.", "sapStructure": ""}, {"name": "ReasonCode", "type": "ReasonCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/ReasonCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código del motivo. Código numérico del motivo de rectificación. \\"01\\" a \\"16\\" errores según reglamento RD 1496/2003; \\"80\\" a \\"85\\" errores según Artº 80 Ley 37/92 el IVA.", "sapStructure": ""}, {"name": "ReasonDescription", "type": "ReasonDescriptionType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/ReasonDescription", "isLeaf": true, "children": [], "required": "Yes", "description": "Descripción motivo. Descripción del motivo de rectificación y que se corresponde con cada código. Ver tabla de códigos y descripciones.", "sapStructure": ""}, {"name": "TaxPeriod", "type": "PeriodDates", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/TaxPeriod", "isLeaf": false, "children": [{"name": "StartDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/TaxPeriod/StartDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha de inicio. ISO 8601:2004.", "sapStructure": ""}, {"name": "EndDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/TaxPeriod/EndDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha final. ISO 8601:2004.", "sapStructure": ""}], "required": "Yes", "description": "Período natural en el que se produjeron los efectos fiscales de la factura a rectificar; y, por lo tanto, se tributó, y que ahora, es objeto de rectificación. ISO 8601:2004.", "sapStructure": ""}, {"name": "CorrectionMethod", "type": "CorrectionMethodType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/CorrectionMethod", "isLeaf": true, "children": [], "required": "Yes", "description": "Código numérico que identifica el criterio empleado en cada caso para una rectificación. \\"01\\" - se reflejan todos los detalles a rectificar de la factura original. \\"02\\" - sólo se anotan los detalles ya rectificados.  \\"03\\" - Rectificación por descuento por volumen de operaciones durante un periodo. - \\"04\\" - Autorizadas por la Agencia Tributaria\\".", "sapStructure": ""}, {"name": "CorrectionMethodDescription", "type": "CorrectionMethodDescriptionType", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/CorrectionMethodDescription", "isLeaf": true, "children": [], "required": "Yes", "description": "Descripción del criterio asociada al código indicado en el campo anterior. \\"01\\" - Rectificación modelo íntegro. \\"02\\" - Rectificación modelo por diferencias. \\"03\\" - Rectificación por descuento por volumen de operaciones durante un periodo. - \\"04\\" - Autorizadas por la Agencia Tributaria\\".", "sapStructure": ""}, {"name": "AdditionalReasonDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/AdditionalReasonDescription", "isLeaf": true, "children": [], "required": "No", "description": "Ampliación motivo de la rectificación. Descripción de las aclaraciones y motivos de la factura rectificativa.", "sapStructure": ""}, {"name": "InvoiceIssueDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceHeader/Corrective/InvoiceIssueDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha de expedición de la factura rectificada. Valor obligatorio en el supuesto de que el valor de CorrectionMethod sea \\"01\\" o \\"02\\"", "sapStructure": ""}], "required": "No", "description": "Rectificativa.", "sapStructure": ""}], "required": "Yes", "description": "Cabecera de factura. Para cada una de las facturas que pueden componer un Lote, recoge datos que determinan inequívocamente cada factura.", "sapStructure": ""}, {"name": "InvoiceIssueData", "type": "InvoiceIssueDataType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData", "isLeaf": false, "children": [{"name": "IssueDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/IssueDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha de expedición. Fecha en la que se genera la factura con efectos fiscales. ISO 8601:2004. Esta fecha no podrá ser posterior a la fecha de la firma electrónica.", "sapStructure": ""}, {"name": "OperationDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/OperationDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha de Operación. Fecha en la que se realiza el servicio o se entrega el bien. ISO 8601:2004. Esta fecha solo será obligatoria si es distinta de la fecha de expedición.", "sapStructure": ""}, {"name": "PlaceOfIssue", "type": "PlaceOfIssueType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/PlaceOfIssue", "isLeaf": false, "children": [{"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/PlaceOfIssue/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código postal. Asignado por Correos.", "sapStructure": ""}, {"name": "PlaceOfIssueDescription", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/PlaceOfIssue/PlaceOfIssueDescription", "isLeaf": true, "children": [], "required": "No", "description": "Texto del nombre del lugar.", "sapStructure": ""}], "required": "No", "description": "Lugar de expedición. Plaza en la que se expide el documento.", "sapStructure": ""}, {"name": "InvoicingPeriod", "type": "PeriodDates", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/InvoicingPeriod", "isLeaf": false, "children": [{"name": "StartDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/InvoicingPeriod/StartDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha de inicio. ISO 8601:2004.", "sapStructure": ""}, {"name": "EndDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/InvoicingPeriod/EndDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha final. ISO 8601:2004.", "sapStructure": ""}], "required": "No", "description": "Periodo de facturación. Sólo cuando se requiera: Servicio prestado temporalmente o Factura Recapitulativa. Esta información será obligatoria cuando el dato InvoiceClass (Clase) contenga alguno de los valores: \\"OC\\" ó \\"CC\\". ISO 8601:2004.", "sapStructure": ""}, {"name": "InvoiceCurrencyCode", "type": "CurrencyCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/InvoiceCurrencyCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Moneda de la operación. Código ISO 4217:2001 Alpha-3 de la moneda en la que se emite la factura. Si la moneda de la operación difiere de la moneda del impuesto (EURO), los campos del contravalor ExchangeRate y ExchangeRateDate deberán cumplimentarse, en cumplimiento del Artº 10.1 del Reglamento sobre facturación. RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "ExchangeRateDetails", "type": "ExchangeRateDetailsType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/ExchangeRateDetails", "isLeaf": false, "children": [{"name": "ExchangeRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/ExchangeRateDetails/ExchangeRate", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de Cambio. Artº 79.once de la Ley 37/92 de 28 de diciembre del Impuesto sobre el Valor Añadido. Cambio vendedor fijado por el Banco de España y vigente en el momento del devengo. Hasta ocho decimales.", "sapStructure": ""}, {"name": "ExchangeRateDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/ExchangeRateDetails/ExchangeRateDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha de publicación del tipo de cambio aplicado. ISO 8601:2004.", "sapStructure": ""}], "required": "No", "description": "Detalles del tipo de cambio.", "sapStructure": ""}, {"name": "TaxCurrencyCode", "type": "CurrencyCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/TaxCurrencyCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Moneda del Impuesto. Código ISO 4217:2001 Alpha-3 de la moneda en la que se liquida el impuesto.", "sapStructure": ""}, {"name": "LanguageName", "type": "LanguageCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/LanguageName", "isLeaf": true, "children": [], "required": "Yes", "description": "Lengua. Código ISO 639-1:2002 Alpha-2 de la lengua en la que se emite el documento.", "sapStructure": ""}, {"name": "InvoiceDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/InvoiceDescription", "isLeaf": true, "children": [], "required": "No", "description": "Descripción general de la factura.", "sapStructure": ""}, {"name": "ReceiverTransactionReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/ReceiverTransactionReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia de pedido.", "sapStructure": ""}, {"name": "FileReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/FileReference", "isLeaf": true, "children": [], "required": "No", "description": "Código del expediente de contratación.", "sapStructure": ""}, {"name": "ReceiverContractReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceIssueData/ReceiverContractReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del contrato del receptor.", "sapStructure": ""}], "required": "Yes", "description": "Datos de la emisión de la factura.", "sapStructure": ""}, {"name": "TaxesOutputs", "type": "Inline", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs", "isLeaf": false, "children": [{"name": "Tax", "type": "TaxOutputType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax", "isLeaf": false, "children": [{"name": "TaxTypeCode", "type": "TaxTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificador del impuesto por el que se tributa. En caso de que el impuesto no corresponda a ninguno de los relacionados en “TaxTypeCodeType”, utilícese el código “05”, definido como “otro”. En este caso, se empleará el elemento “AditionalLineItemInformation” para identificar el impuesto, donde se incluirá, para ello, la siguiente cadena de caracteres: 05 = [nombre del impuesto]. Si hubiera varios impuestos con el código “05”, se añadirán los valores de sus campos “TaxRate”, “TaxableBase” y “TaxAmount”, en este orden, hasta que sea posible discernirlos; es decir: 05 [valor “TaxRate”] [valor “TaxableBase”] [valor “TaxAmount”] = [nombre del impuesto]. Cuando la operación esté exenta del impuesto o se encuentre en régimen suspensivo, deberá indicarse el motivo en el elemento “AditionalLineItemInformation”. Este elemento se define a nivel de línea, no de impuesto; por ello, para identificar cuál es el impuesto del que está exenta, el motivo irá precedido del código del impuesto; por ejemplo: 07 exenta por….", "sapStructure": ""}, {"name": "TaxRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxRate", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo impositivo. Téngase en cuenta que no siempre son porcentajes. La legislación del impuesto correspondiente permitirá identificar las unidades y dimensiones del tipo impositivo. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Base imponible. La legislación del impuesto correspondiente determina cómo se calcula la base imponible.Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/TaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota. La legislación del impuesto correspondiente determina cómo se calcula la cuota. Hasta ocho decimales.", "sapStructure": ""}, {"name": "SpecialTaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Base imponible del régimen especial del grupo de entidades (Arts. 163 quinquies a 163 nonies de la Ley 37/1992, de 28 de diciembre, del IVA). En el caso de aplicar el régimen especial habrán de consignar en factura no sólo la base conforme al coste de adquisición de los bienes y servicios sino, además, la base que hubiera correspondido tener en cuenta de no aplicarse el régimen especial. Es decir: deben consignarse dos bases distintas para la misma operación aunque el cálculo de la cuota sólo debe efectuarse respecto de la base imponible del régimen especial. En el caso en el que se expida factura con repercusión del impuesto a pesar de tratarse de una de las operaciones exentas de las reguladas en el artículo 20.Uno de la Ley 37/1992, de 28 de diciembre, se tiene que especificar que se está repercutiendo el impuesto porque se ha renunciado a la exención tal y como habilita el artículo 163.sexies.Cinco de la Ley del impuesto. Esto se indicará en el elemento “AdditionalLineItemInformation” con la siguiente expresión: “Renuncia a la exención en virtud artículo 163.sexies.Cinco de la Ley 37/1992”. Hasta ocho decimales.", "sapStructure": ""}, {"name": "SpecialTaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/SpecialTaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota especial. Importe resultante de aplicar el tipo de gravamen sobre la base imponible del régimen especial del grupo de entidades. Hasta ocho decimales.", "sapStructure": ""}, {"name": "EquivalenceSurcharge", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/EquivalenceSurcharge", "isLeaf": true, "children": [], "required": "No", "description": "Tipo de recargo de Equivalencia. Siempre con dos decimales.", "sapStructure": ""}, {"name": "EquivalenceSurchargeAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/EquivalenceSurchargeAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/EquivalenceSurchargeAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesOutputs/Tax/EquivalenceSurchargeAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota. Importe resultante de aplicar a la Base Imponible, la misma que para el IVA, el porcentaje indicado en “EquivalenceSurchage”. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Impuesto.", "sapStructure": ""}], "required": "Yes", "description": "Impuestos repercutidos.", "sapStructure": ""}, {"name": "TaxesWithheld", "type": "TaxesType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld", "isLeaf": false, "children": [{"name": "Tax", "type": "TaxType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax", "isLeaf": false, "children": [{"name": "TaxTypeCode", "type": "TaxTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificador del impuesto por cuenta del cual se retiene. En caso de que el impuesto no corresponda a ninguno de los relacionados en “TaxTypeCodeType”, utilícese el código “05”, definido como “otro”. En este caso, se empleará el elemento “AditionalLineItemInformation” para identificar el impuesto, donde se incluirá, para ello, la siguiente cadena de caracteres: 05 = [nombre del impuesto]. Si hubiera varios impuestos con el código “05”, se añadirán los valores de sus campos “TaxRate”, “TaxableBase” y “TaxAmount”, en este orden, hasta que sea posible discernirlos; es decir: 05 [valor “TaxRate”] [valor “TaxableBase”] [valor “TaxAmount”] = [nombre del impuesto].", "sapStructure": ""}, {"name": "TaxRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxRate", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo impositivo. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Base de retención. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/TaxesWithheld/Tax/TaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Importe de la retención. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Impuesto.", "sapStructure": ""}], "required": "No", "description": "Impuestos retenidos.", "sapStructure": ""}, {"name": "InvoiceTotals", "type": "InvoiceTotalsType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals", "isLeaf": false, "children": [{"name": "TotalGrossAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalGrossAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Total Importe Bruto. Suma total de importes brutos de los detalles de la factura. Hasta ocho decimales.", "sapStructure": ""}, {"name": "GeneralDiscounts", "type": "DiscountsAndRebatesType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralDiscounts", "isLeaf": false, "children": [{"name": "Discount", "type": "DiscountType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralDiscounts/Discount", "isLeaf": false, "children": [{"name": "DiscountReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralDiscounts/Discount/DiscountReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Concepto por el que se aplica descuento.", "sapStructure": ""}, {"name": "DiscountRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralDiscounts/Discount/DiscountRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje a descontar del Total Importe Bruto (TIB). Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "DiscountAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralDiscounts/Discount/DiscountAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a descontar sobre el TIB. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Descuento.", "sapStructure": ""}], "required": "No", "description": "Descuentos sobre el Total Importe Bruto. Habrá tantos bloques de campos GeneralDiscounts como clases de descuentos diferentes se apliquen a nivel de factura.", "sapStructure": ""}, {"name": "GeneralSurcharges", "type": "ChargesType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralSurcharges", "isLeaf": false, "children": [{"name": "Charge", "type": "ChargeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralSurcharges/Charge", "isLeaf": false, "children": [{"name": "ChargeReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralSurcharges/Charge/ChargeReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Concepto por el que se aplica el cargo.", "sapStructure": ""}, {"name": "ChargeRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralSurcharges/Charge/ChargeRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje a cargar sobre el TIB. Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "ChargeAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/GeneralSurcharges/Charge/ChargeAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a cargar sobre el TIB. Hasta 8 decimales.", "sapStructure": ""}], "required": "Yes", "description": "Cargo.", "sapStructure": ""}], "required": "No", "description": "Cargos sobre el Total Importe Bruto. Habrá tantos bloques de campos GeneralSurcharges como clases de cargos/recargos se apliquen, a nivel de factura.", "sapStructure": ""}, {"name": "TotalGeneralDiscounts", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalGeneralDiscounts", "isLeaf": true, "children": [], "required": "No", "description": "Total general de descuentos. Sumatorio de los importes de los diferentes campos GeneralDiscounts. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalGeneralSurcharges", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalGeneralSurcharges", "isLeaf": true, "children": [], "required": "No", "description": "Total general de cargos. Sumatorio de los importes de los diferentes campos GeneralSurcharges. Hasta ocho decimales", "sapStructure": ""}, {"name": "TotalGrossAmountBeforeTaxes", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalGrossAmountBeforeTaxes", "isLeaf": true, "children": [], "required": "Yes", "description": "Total importe bruto antes de impuestos. Resultado de: TotalGrossAmount - TotalGeneralDiscounts + TotalGeneralSurcharges. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalTaxOutputs", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalTaxOutputs", "isLeaf": true, "children": [], "required": "Yes", "description": "Total impuestos repercutidos. Sumatorio de todas Cuotas y Recargos de Equivalencia. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalTaxesWithheld", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalTaxesWithheld", "isLeaf": true, "children": [], "required": "Yes", "description": "Total impuestos retenidos. Hasta ocho decimales.", "sapStructure": ""}, {"name": "InvoiceTotal", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/InvoiceTotal", "isLeaf": true, "children": [], "required": "Yes", "description": "Total factura. Resultado de: TotalGrossAmountBeforeTaxes + TotalTaxOutputs - TotalTaxesWithheld. Hasta ocho decimales.", "sapStructure": ""}, {"name": "Subsidies", "type": "SubsidiesType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/Subsidies", "isLeaf": false, "children": [{"name": "Subsidy", "type": "SubsidyType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/Subsidies/Subsidy", "isLeaf": false, "children": [{"name": "SubsidyDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/Subsidies/Subsidy/SubsidyDescription", "isLeaf": true, "children": [], "required": "Yes", "description": "Detalle de la Subvención aplicada.", "sapStructure": ""}, {"name": "SubsidyRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/Subsidies/Subsidy/SubsidyRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje de la Subvención. Porcentaje a aplicar al Total Factura. Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "SubsidyAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/Subsidies/Subsidy/SubsidyAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe de la Subvención. Importe a aplicar al Total Factura. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Subvención.", "sapStructure": ""}], "required": "No", "description": "Subvenciones por adquisición de determinados bienes. Habrá tantos bloques de campos Subsidies como subvenciones se apliquen. En el caso de que la subvención se aplique solo a parte de las operaciones facturadas, en el subelemento SubsidyDescription se especificará también a qué operación corresponde.", "sapStructure": ""}, {"name": "PaymentsOnAccount", "type": "PaymentsOnAccountType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentsOnAccount", "isLeaf": false, "children": [{"name": "PaymentOnAccount", "type": "PaymentOnAccountType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentsOnAccount/PaymentOnAccount", "isLeaf": false, "children": [{"name": "PaymentOnAccountDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentsOnAccount/PaymentOnAccount/PaymentOnAccountDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha/s del/os anticipo/s. ISO 8601:2004.", "sapStructure": ""}, {"name": "PaymentOnAccountAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentsOnAccount/PaymentOnAccount/PaymentOnAccountAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe de cada anticipo. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Anticipo.", "sapStructure": ""}], "required": "No", "description": "Anticipos. Pagos anticipados sobre el Total Facturas. Habrá tantos bloques PaymentsOnAccount como clases de anticipos se apliquen a nivel factura.", "sapStructure": ""}, {"name": "ReimbursableExpenses", "type": "ReimbursableExpenses", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses", "isLeaf": false, "children": [{"name": "ReimbursableExpenses", "type": "ReimbursableExpensesType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses", "isLeaf": false, "children": [{"name": "ReimbursableExpensesSellerParty", "type": "TaxIdentificationType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesSellerParty", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesSellerParty/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": ""}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesSellerParty/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": ""}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesSellerParty/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": ""}], "required": "No", "description": "", "sapStructure": ""}, {"name": "ReimbursableExpensesBuyerParty", "type": "TaxIdentificationType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesBuyerParty", "isLeaf": false, "children": [{"name": "PersonTypeCode", "type": "PersonTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesBuyerParty/PersonTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo de persona. Física o Jurídica. \\"F\\" - Física; \\"J\\" - Jurídica.", "sapStructure": ""}, {"name": "ResidenceTypeCode", "type": "ResidenceTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesBuyerParty/ResidenceTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificación del tipo de residencia y/o extranjería. \\"E\\" - Extranjero; \\"R\\" - Residente; \\"U\\" - Residente en la Unión Europea.", "sapStructure": ""}, {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesBuyerParty/TaxIdentificationNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "sapStructure": ""}], "required": "No", "description": "", "sapStructure": ""}, {"name": "IssueDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/IssueDate", "isLeaf": true, "children": [], "required": "No", "description": "", "sapStructure": ""}, {"name": "InvoiceNumber", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/InvoiceNumber", "isLeaf": true, "children": [], "required": "No", "description": "", "sapStructure": ""}, {"name": "InvoiceSeriesCode", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/InvoiceSeriesCode", "isLeaf": true, "children": [], "required": "No", "description": "", "sapStructure": ""}, {"name": "ReimbursableExpensesAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/ReimbursableExpenses/ReimbursableExpenses/ReimbursableExpensesAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Entre 0 y 8 decimales.", "sapStructure": ""}], "required": "Yes", "description": "Suplidos.", "sapStructure": ""}], "required": "No", "description": "Suplidos incorporados en la factura.", "sapStructure": ""}, {"name": "TotalFinancialExpenses", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalFinancialExpenses", "isLeaf": true, "children": [], "required": "No", "description": "Total de gastos financieros. Siempre con dos decimales.", "sapStructure": ""}, {"name": "TotalOutstandingAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalOutstandingAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Total a pagar. Resultado de: InvoiceTotal - (Total subvenciones + TotalPaymentsOnAccount). En Total subvenciones se suman las cantidades especificadas en los bloques Subsidies. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalPaymentsOnAccount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalPaymentsOnAccount", "isLeaf": true, "children": [], "required": "No", "description": "Total de anticipos. Sumatorio de los campos PaymentOnAccountAmount. Hasta ocho decimales.", "sapStructure": ""}, {"name": "AmountsWithheld", "type": "AmountsWithheldType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/AmountsWithheld", "isLeaf": false, "children": [{"name": "WithholdingReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/AmountsWithheld/WithholdingReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Motivo de Retención. Descripción de la finalidad de la Retención.", "sapStructure": ""}, {"name": "WithholdingRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/AmountsWithheld/WithholdingRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje de Retención. Porcentaje sobre el Total a Pagar. Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "WithholdingAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/AmountsWithheld/WithholdingAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe de Retención. Importe a retener sobre el Total a Pagar. Hasta ocho decimales.", "sapStructure": ""}], "required": "No", "description": "Cantidades que retiene el pagador hasta el buen fin de la operación.", "sapStructure": ""}, {"name": "TotalExecutableAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalExecutableAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Total a ejecutar. Resultado de: TotalOutstandingAmount - WithholdingAmount - PaymentInKindAmount + TotalReimbursableExpenses  + TotalFinancialExpenses. En Total de Cantidades retenidas se sumaran las cantidades especificadas en los bloques AmountsWithheld. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalReimbursableExpenses", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/TotalReimbursableExpenses", "isLeaf": true, "children": [], "required": "No", "description": "Total de suplidos. Hasta ocho decimales.", "sapStructure": ""}, {"name": "PaymentInKind", "type": "PaymentInKindType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentInKind", "isLeaf": false, "children": [{"name": "PaymentInKindReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentInKind/PaymentInKindReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Descripción del motivo por el que existe un pago en especie", "sapStructure": ""}, {"name": "PaymentInKindAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/InvoiceTotals/PaymentInKind/PaymentInKindAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe de los pagos en especie", "sapStructure": ""}], "required": "No", "description": "Pagos en especie.", "sapStructure": ""}], "required": "Yes", "description": "Totales de factura.", "sapStructure": ""}, {"name": "Items", "type": "ItemsType", "xpath": "/Facturae/Invoices/Invoice/Items", "isLeaf": false, "children": [{"name": "InvoiceLine", "type": "InvoiceLineType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine", "isLeaf": false, "children": [{"name": "IssuerContractReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/IssuerContractReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del contrato del Emisor.", "sapStructure": ""}, {"name": "IssuerContractDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/IssuerContractDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha del contrato del emisor.", "sapStructure": ""}, {"name": "IssuerTransactionReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/IssuerTransactionReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia de la Operación, Número de Pedido, Contrato, etc. del Emisor.", "sapStructure": ""}, {"name": "IssuerTransactionDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/IssuerTransactionDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha de operación / pedido del emisor.", "sapStructure": ""}, {"name": "ReceiverContractReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ReceiverContractReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del contrato del Receptor.", "sapStructure": ""}, {"name": "ReceiverContractDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ReceiverContractDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha del contrato del receptor.", "sapStructure": ""}, {"name": "ReceiverTransactionReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ReceiverTransactionReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia de la Operación, Número de Pedido, Contrato, etc. del Receptor.", "sapStructure": ""}, {"name": "ReceiverTransactionDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ReceiverTransactionDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha de operación / pedido del receptor.", "sapStructure": ""}, {"name": "FileReference", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/FileReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del expediente.", "sapStructure": ""}, {"name": "FileDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/FileDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha del expediente.", "sapStructure": ""}, {"name": "SequenceNumber", "type": "xs:double", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/SequenceNumber", "isLeaf": true, "children": [], "required": "No", "description": "Número de secuencia o línea del pedido.", "sapStructure": ""}, {"name": "DeliveryNotesReferences", "type": "DeliveryNotesReferencesType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DeliveryNotesReferences", "isLeaf": false, "children": [{"name": "DeliveryNote", "type": "DeliveryNoteType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DeliveryNotesReferences/DeliveryNote", "isLeaf": false, "children": [{"name": "DeliveryNoteNumber", "type": "TextMax30Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DeliveryNotesReferences/DeliveryNote/DeliveryNoteNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Delivery note reference number.", "sapStructure": ""}, {"name": "DeliveryNoteDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DeliveryNotesReferences/DeliveryNote/DeliveryNoteDate", "isLeaf": true, "children": [], "required": "No", "description": "Date show on the delivery note.", "sapStructure": ""}], "required": "Yes", "description": "Información del albarán.", "sapStructure": ""}], "required": "No", "description": "Referencias de albaranes.", "sapStructure": ""}, {"name": "ItemDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ItemDescription", "isLeaf": true, "children": [], "required": "Yes", "description": "Descripción del bien o servicio.", "sapStructure": ""}, {"name": "Quantity", "type": "xs:double", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Quantity", "isLeaf": true, "children": [], "required": "Yes", "description": "Cantidad. Número de Unidades servidas/prestadas.", "sapStructure": ""}, {"name": "UnitOfMeasure", "type": "UnitOfMeasureType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/UnitOfMeasure", "isLeaf": true, "children": [], "required": "No", "description": "Unidad en que está referida la Cantidad. Recomendación 20, Revisión 4 y Recomendación 21, Revisión 5 de UN/CEFACT.", "sapStructure": ""}, {"name": "UnitPriceWithoutTax", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/UnitPriceWithoutTax", "isLeaf": true, "children": [], "required": "Yes", "description": "Precio de la unidad de bien o servicio servido/prestado, en la moneda indicada en la Cabecera de la Factura. Siempre sin Impuestos. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TotalCost", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TotalCost", "isLeaf": true, "children": [], "required": "Yes", "description": "Coste Total. Resultado: Quantity x UnitPriceWithoutTax. Hasta ocho decimales.", "sapStructure": ""}, {"name": "DiscountsAndRebates", "type": "DiscountsAndRebatesType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DiscountsAndRebates", "isLeaf": false, "children": [{"name": "Discount", "type": "DiscountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DiscountsAndRebates/Discount", "isLeaf": false, "children": [{"name": "DiscountReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DiscountsAndRebates/Discount/DiscountReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Concepto por el que se aplica descuento.", "sapStructure": ""}, {"name": "DiscountRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DiscountsAndRebates/Discount/DiscountRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje a descontar del Total Importe Bruto (TIB). Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "DiscountAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/DiscountsAndRebates/Discount/DiscountAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a descontar sobre el TIB. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Descuento.", "sapStructure": ""}], "required": "No", "description": "Descuentos.", "sapStructure": ""}, {"name": "Charges", "type": "ChargesType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Charges", "isLeaf": false, "children": [{"name": "Charge", "type": "ChargeType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Charges/Charge", "isLeaf": false, "children": [{"name": "ChargeReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Charges/Charge/ChargeReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Concepto por el que se aplica el cargo.", "sapStructure": ""}, {"name": "ChargeRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Charges/Charge/ChargeRate", "isLeaf": true, "children": [], "required": "No", "description": "Porcentaje a cargar sobre el TIB. Los porcentajes se reflejan con hasta 8 decimales.", "sapStructure": ""}, {"name": "ChargeAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Charges/Charge/ChargeAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a cargar sobre el TIB. Hasta 8 decimales.", "sapStructure": ""}], "required": "Yes", "description": "Cargo.", "sapStructure": ""}], "required": "No", "description": "Cargos.", "sapStructure": ""}, {"name": "GrossAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/GrossAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe bruto. Resultado: TotalCost - DiscountAmount + ChargeAmount. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxesWithheld", "type": "TaxesType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld", "isLeaf": false, "children": [{"name": "Tax", "type": "TaxType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax", "isLeaf": false, "children": [{"name": "TaxTypeCode", "type": "TaxTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificador del impuesto por cuenta del cual se retiene. En caso de que el impuesto no corresponda a ninguno de los relacionados en “TaxTypeCodeType”, utilícese el código “05”, definido como “otro”. En este caso, se empleará el elemento “AditionalLineItemInformation” para identificar el impuesto, donde se incluirá, para ello, la siguiente cadena de caracteres: 05 = [nombre del impuesto]. Si hubiera varios impuestos con el código “05”, se añadirán los valores de sus campos “TaxRate”, “TaxableBase” y “TaxAmount”, en este orden, hasta que sea posible discernirlos; es decir: 05 [valor “TaxRate”] [valor “TaxableBase”] [valor “TaxAmount”] = [nombre del impuesto].", "sapStructure": ""}, {"name": "TaxRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxRate", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo impositivo. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Base de retención. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesWithheld/Tax/TaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Importe de la retención. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Impuesto.", "sapStructure": ""}], "required": "No", "description": "Impuestos retenidos. Es una secuencia de elementos, cada uno de los cuales contiene la información de un impuesto retenido.", "sapStructure": ""}, {"name": "TaxesOutputs", "type": "Inline", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs", "isLeaf": false, "children": [{"name": "Tax", "type": "Inline", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax", "isLeaf": false, "children": [{"name": "TaxTypeCode", "type": "TaxTypeCodeType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxTypeCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Identificador del impuesto por el que se tributa. En caso de que el impuesto no corresponda a ninguno de los relacionados en “TaxTypeCodeType”, utilícese el código “05”, definido como “otro”. En este caso, se empleará el elemento “AditionalLineItemInformation” para identificar el impuesto, donde se incluirá, para ello, la siguiente cadena de caracteres: 05 = [nombre del impuesto]. Si hubiera varios impuestos con el código “05”, se añadirán los valores de sus campos “TaxRate”, “TaxableBase” y “TaxAmount”, en este orden, hasta que sea posible discernirlos; es decir: 05 [valor “TaxRate”] [valor “TaxableBase”] [valor “TaxAmount”] = [nombre del impuesto]. Cuando la operación esté exenta del impuesto o se encuentre en régimen suspensivo, deberá indicarse el motivo en el elemento “AditionalLineItemInformation”. Este elemento se define a nivel de línea, no de impuesto; por ello, para identificar cuál es el impuesto del que está exenta, el motivo irá precedido del código del impuesto; por ejemplo: 07 exenta por….", "sapStructure": ""}, {"name": "TaxRate", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxRate", "isLeaf": true, "children": [], "required": "Yes", "description": "Tipo impositivo. Téngase en cuenta que no siempre son porcentajes. La legislación del impuesto correspondiente permitirá identificar las unidades y dimensiones del tipo impositivo. Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "Yes", "description": "Base imponible. La legislación del impuesto correspondiente determina cómo se calcula la base imponible.Hasta ocho decimales.", "sapStructure": ""}, {"name": "TaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/TaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota. La legislación del impuesto correspondiente determina cómo se calcula la cuota. Hasta ocho decimales.", "sapStructure": ""}, {"name": "SpecialTaxableBase", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxableBase", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxableBase/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxableBase/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Base imponible del régimen especial del grupo de entidades (Arts. 163 quinquies a 163 nonies de la Ley 37/1992, de 28 de diciembre, del IVA). En el caso de aplicar el régimen especial habrán de consignar en factura no sólo la base conforme al coste de adquisición de los bienes y servicios sino, además, la base que hubiera correspondido tener en cuenta de no aplicarse el régimen especial. Es decir: deben consignarse dos bases distintas para la misma operación aunque el cálculo de la cuota sólo debe efectuarse respecto de la base imponible del régimen especial. En el caso en el que se expida factura con repercusión del impuesto a pesar de tratarse de una de las operaciones exentas de las reguladas en el artículo 20.Uno de la Ley 37/1992, de 28 de diciembre, se tiene que especificar que se está repercutiendo el impuesto porque se ha renunciado a la exención tal y como habilita el artículo 163.sexies.Cinco de la Ley del impuesto. Esto se indicará en el elemento “AdditionalLineItemInformation” con la siguiente expresión: “Renuncia a la exención en virtud artículo 163.sexies.Cinco de la Ley 37/1992”. Hasta ocho decimales.", "sapStructure": ""}, {"name": "SpecialTaxAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/SpecialTaxAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota especial. Importe resultante de aplicar el tipo de gravamen sobre la base imponible del régimen especial del grupo de entidades. Hasta ocho decimales.", "sapStructure": ""}, {"name": "EquivalenceSurcharge", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/EquivalenceSurcharge", "isLeaf": true, "children": [], "required": "No", "description": "Tipo de recargo de Equivalencia. Siempre con dos decimales.", "sapStructure": ""}, {"name": "EquivalenceSurchargeAmount", "type": "AmountType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/EquivalenceSurchargeAmount", "isLeaf": false, "children": [{"name": "TotalAmount", "type": "DoubleUpToEightDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/EquivalenceSurchargeAmount/TotalAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe en la moneda original de la facturación. Siempre que la divisa de facturación sea distinta de EURO, el elemento EquivalentInEuros deberá cumplimentarse para satisfacer los requerimientos del Art.10.1 del Reglamento sobre facturación, RD 1496/2003 de 28 de Noviembre.", "sapStructure": ""}, {"name": "EquivalentInEuros", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TaxesOutputs/Tax/EquivalenceSurchargeAmount/EquivalentInEuros", "isLeaf": true, "children": [], "required": "No", "description": "Importe equivalente en Euros. Siempre con dos decimales.", "sapStructure": ""}], "required": "No", "description": "Cuota. Importe resultante de aplicar a la Base Imponible, la misma que para el IVA, el porcentaje indicado en “EquivalenceSurchage”. Hasta ocho decimales.", "sapStructure": ""}], "required": "Yes", "description": "Detalle impuestos repercutidos.", "sapStructure": ""}], "required": "Yes", "description": "Impuestos repercutidos. Es una secuencia de elementos, cada uno de los cuales contiene la información de un impuesto repercutido.", "sapStructure": ""}, {"name": "LineItemPeriod", "type": "PeriodDates", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/LineItemPeriod", "isLeaf": false, "children": [{"name": "StartDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/LineItemPeriod/StartDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha de inicio. ISO 8601:2004.", "sapStructure": ""}, {"name": "EndDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/LineItemPeriod/EndDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fecha final. ISO 8601:2004.", "sapStructure": ""}], "required": "No", "description": "Información sobre el periodo de prestación de un servicio. ISO 8601 :2004.", "sapStructure": ""}, {"name": "TransactionDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/TransactionDate", "isLeaf": true, "children": [], "required": "No", "description": "Fecha concreta de prestación o entrega del bien o servicio. ISO 8601:2004.", "sapStructure": ""}, {"name": "AdditionalLineItemInformation", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/AdditionalLineItemInformation", "isLeaf": true, "children": [], "required": "No", "description": "Información adicional. Libre para el emisor por cada detalle.", "sapStructure": ""}, {"name": "SpecialTaxableEvent", "type": "SpecialTaxableEventType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/SpecialTaxableEvent", "isLeaf": false, "children": [{"name": "SpecialTaxableEventCode", "type": "SpecialTaxableEventCodeType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/SpecialTaxableEvent/SpecialTaxableEventCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código de fiscalidad especial. Cuando un hecho imponible (taxable event) presenta una fiscalidad especial. No se informará este elemento cuando no exista fiscalidad especial.", "sapStructure": ""}, {"name": "SpecialTaxableEventReason", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/SpecialTaxableEvent/SpecialTaxableEventReason", "isLeaf": true, "children": [], "required": "Yes", "description": "Justificación de la fiscalidad especial que se aplica en esta operación. Como este elemento se define a nivel de línea, no de impuesto, es necesario especificar a qué impuesto se refiere. Para establecer esta relación, al comienzo de este elemento se indicará el código del impuesto al que corresponde según la lista de código de impuestos del tipo “TaxTypeCodeType”. Si hubiera varios impuestos con el código “05” (“Otro”), se añadirán los valores de sus campos “TaxRate”, “TaxableBase” y “TaxAmount”, en este orden, hasta que sea posible discernirlos; es decir: 05 [valor “TaxRate”] [valor “TaxableBase”] [valor “TaxAmount”]…", "sapStructure": ""}], "required": "No", "description": "Este campo indica la obligatoriedad de los impuestos.", "sapStructure": ""}, {"name": "ArticleCode", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/ArticleCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de artículo.", "sapStructure": ""}, {"name": "Extensions", "type": "ExtensionsType", "xpath": "/Facturae/Invoices/Invoice/Items/InvoiceLine/Extensions", "isLeaf": false, "children": [], "required": "No", "description": "Extensiones. Podrán incorporarse nuevas definiciones estructuradas cuando sean de interés conjunto para emisores y receptores, y no estén ya definidas en el esquema de la factura.", "sapStructure": ""}], "required": "Yes", "description": "Lineas de detalle de la factura.", "sapStructure": ""}], "required": "Yes", "description": "Información detallada.", "sapStructure": ""}, {"name": "PaymentDetails", "type": "InstallmentsType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails", "isLeaf": false, "children": [{"name": "Installment", "type": "InstallmentType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment", "isLeaf": false, "children": [{"name": "InstallmentDueDate", "type": "xs:date", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/InstallmentDueDate", "isLeaf": true, "children": [], "required": "Yes", "description": "Fechas en las que se deben atender los pagos. ISO 8601:2004.", "sapStructure": ""}, {"name": "InstallmentAmount", "type": "DoubleTwoDecimalType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/InstallmentAmount", "isLeaf": true, "children": [], "required": "Yes", "description": "Importe a satisfacer en cada plazo. Siempre con dos decimales.", "sapStructure": ""}, {"name": "PaymentMeans", "type": "PaymentMeansType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/PaymentMeans", "isLeaf": true, "children": [], "required": "Yes", "description": "Cada vencimiento/importe podrá tener un medio de pago concreto.", "sapStructure": ""}, {"name": "AccountToBeCredited", "type": "AccountType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited", "isLeaf": false, "children": [{"name": "IBAN", "type": "TextMin5Max34Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/IBAN", "isLeaf": true, "children": [], "required": "Yes", "description": "IBAN. Único formato admitido para identificar la cuenta. (Recomendado)", "sapStructure": ""}, {"name": "AccountNumber", "type": "TextMin5Max34Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/AccountNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Número de cuenta.", "sapStructure": ""}, {"name": "BankCode", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BankCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la entidad financiera.", "sapStructure": ""}, {"name": "BranchCode", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la oficina de la entidad financiera.", "sapStructure": ""}, {"name": "BranchInSpainAddress", "type": "AddressType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BranchInSpainAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en España.", "sapStructure": ""}, {"name": "OverseasBranchAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/OverseasBranchAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en el extranjero.", "sapStructure": ""}, {"name": "BIC", "type": "BICType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeCredited/BIC", "isLeaf": true, "children": [], "required": "No", "description": "Código SWIFT. Será obligatorio rellenar las 11 posiciones, utilizando los caracteres XXX cuando no se informe de la sucursal.", "sapStructure": ""}], "required": "No", "description": "Cuenta de abono. Único formato admitido. Cuando la forma de pago (PaymentMeans) sea \\"transferencia\\" este dato será obligatorio.", "sapStructure": ""}, {"name": "PaymentReconciliationReference", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/PaymentReconciliationReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia expresa del pago. Dato que precisa el Emisor para conciliar los pagos con cada factura.", "sapStructure": ""}, {"name": "AccountToBeDebited", "type": "AccountType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited", "isLeaf": false, "children": [{"name": "IBAN", "type": "TextMin5Max34Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/IBAN", "isLeaf": true, "children": [], "required": "Yes", "description": "IBAN. Único formato admitido para identificar la cuenta. (Recomendado)", "sapStructure": ""}, {"name": "AccountNumber", "type": "TextMin5Max34Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/AccountNumber", "isLeaf": true, "children": [], "required": "Yes", "description": "Número de cuenta.", "sapStructure": ""}, {"name": "BankCode", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BankCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la entidad financiera.", "sapStructure": ""}, {"name": "BranchCode", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchCode", "isLeaf": true, "children": [], "required": "No", "description": "Código de la oficina de la entidad financiera.", "sapStructure": ""}, {"name": "BranchInSpainAddress", "type": "AddressType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso…", "sapStructure": ""}, {"name": "PostCode", "type": "PostCodeType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/PostCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código Postal asignado por Correos.", "sapStructure": ""}, {"name": "Town", "type": "TextMax50Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Town", "isLeaf": true, "children": [], "required": "Yes", "description": "Población. Correspondiente al C.P.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia. Donde está situada la Población.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BranchInSpainAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3. Al ser un domicilio ubicado en España siempre será \\"ESP\\".", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en España.", "sapStructure": ""}, {"name": "OverseasBranchAddress", "type": "OverseasAddressType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress", "isLeaf": false, "children": [{"name": "Address", "type": "TextMax80Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/Address", "isLeaf": true, "children": [], "required": "Yes", "description": "Dirección. Tipo de vía, nombre, número, piso....", "sapStructure": ""}, {"name": "PostCodeAndTown", "type": "TextMax50Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/PostCodeAndTown", "isLeaf": true, "children": [], "required": "Yes", "description": "Población y Código Postal en el extranjero.", "sapStructure": ""}, {"name": "Province", "type": "TextMax20Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/Province", "isLeaf": true, "children": [], "required": "Yes", "description": "Provincia, Estado, etc.", "sapStructure": ""}, {"name": "CountryCode", "type": "CountryType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/OverseasBranchAddress/CountryCode", "isLeaf": true, "children": [], "required": "Yes", "description": "Código País. Código según la ISO 3166-1:2006 Alpha-3.", "sapStructure": ""}], "required": "No", "description": "Dirección de la sucursal/oficina en el extranjero.", "sapStructure": ""}, {"name": "BIC", "type": "BICType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/AccountToBeDebited/BIC", "isLeaf": true, "children": [], "required": "No", "description": "Código SWIFT. Será obligatorio rellenar las 11 posiciones, utilizando los caracteres XXX cuando no se informe de la sucursal.", "sapStructure": ""}], "required": "No", "description": "Cuenta de cargo. Único formato admitido. Cuando la forma de pago (PaymentMeans) sea \\"recibo domiciliado\\" este dato será obligatorio.", "sapStructure": ""}, {"name": "CollectionAdditionalInformation", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/CollectionAdditionalInformation", "isLeaf": true, "children": [], "required": "No", "description": "Observaciones de cobro. Libre para uso del Emisor.", "sapStructure": ""}, {"name": "RegulatoryReportingData", "type": "RegulatoryReportingDataType", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/RegulatoryReportingData", "isLeaf": true, "children": [], "required": "No", "description": "Código Estadístico. Usado en las operaciones transfronterizas según las especificaciones de la circular del Banco España 15/1992", "sapStructure": ""}, {"name": "DebitReconciliationReference", "type": "TextMax60Type", "xpath": "/Facturae/Invoices/Invoice/PaymentDetails/Installment/DebitReconciliationReference", "isLeaf": true, "children": [], "required": "No", "description": "Referencia del cliente pagador, similar a la utilizada por elemisor para la conciliación de los pagos.", "sapStructure": ""}], "required": "Yes", "description": "Vencimiento.", "sapStructure": ""}], "required": "No", "description": "Datos de pago.", "sapStructure": ""}, {"name": "LegalLiterals", "type": "LegalLiteralsType", "xpath": "/Facturae/Invoices/Invoice/LegalLiterals", "isLeaf": false, "children": [{"name": "LegalReference", "type": "TextMax250Type", "xpath": "/Facturae/Invoices/Invoice/LegalLiterals/LegalReference", "isLeaf": true, "children": [], "required": "No", "description": "Textos literales que deben figurar obligatoriamente en determinadas facturas. Los textos establecidos en la legislación vigente son: Operación exenta por aplicación del artículo [indicar el artículo] de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido; Medio de transporte [describir el medio, por ejemplo automóvil turismo Seat Ibiza TDI 2.0] fecha 1ª puesta en servicio [indicar la fecha] distancias/horas recorridas [indicar la distancia o las horas, por ejemplo, 5.900 km o 48 horas]; Facturación por el destinatario;Inversión del sujeto pasivo; Régimen especial de las agencias de viajes; Régimen especial de los bienes usados; Régimen especial de los objetos de arte; Régimen especial de las antigüedades y objetos de colección; Régimen especial del criterio de caja. NOTA 1: Salvo el texto “Inversión del sujeto pasivo”, los demás se refieren no a la factura en su conjunto, sino a una determinada operación (línea) de la factura. Se deberá especificar a cuál corresponde. NOTA 2: Debe permitirse la posibilidad de cumplimentar este campo con cualquier cadena alfanumérica de hasta 250 caracteres introducida por el usuario por si se establecen nuevos textos literales obligatorios en el futuro.", "sapStructure": ""}], "required": "No", "description": "Literales legales.", "sapStructure": ""}, {"name": "AdditionalData", "type": "AdditionalDataType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData", "isLeaf": false, "children": [{"name": "RelatedInvoice", "type": "TextMax40Type", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedInvoice", "isLeaf": true, "children": [], "required": "No", "description": "Factura asociada. Número y Serie de acuerdo Emisor/Receptor.", "sapStructure": ""}, {"name": "RelatedDocuments", "type": "AttachedDocumentsType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments", "isLeaf": false, "children": [{"name": "Attachment", "type": "AttachmentType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment", "isLeaf": false, "children": [{"name": "AttachmentCompressionAlgorithm", "type": "AttachmentCompressionAlgorithmType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment/AttachmentCompressionAlgorithm", "isLeaf": true, "children": [], "required": "No", "description": "Algoritmo usado para comprimir el documento adjunto. Ampliar restricciones según convenga.", "sapStructure": ""}, {"name": "AttachmentFormat", "type": "AttachmentFormatType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment/AttachmentFormat", "isLeaf": true, "children": [], "required": "Yes", "description": "Formato del documento adjunto. Ampliar restricciones según convenga.", "sapStructure": ""}, {"name": "AttachmentEncoding", "type": "AttachmentEncodingType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment/AttachmentEncoding", "isLeaf": true, "children": [], "required": "No", "description": "Algoritmo usado para codificar el documento adjunto.", "sapStructure": ""}, {"name": "AttachmentDescription", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment/AttachmentDescription", "isLeaf": true, "children": [], "required": "No", "description": "Descripción del documento.", "sapStructure": ""}, {"name": "AttachmentData", "type": "xs:string", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/RelatedDocuments/Attachment/AttachmentData", "isLeaf": true, "children": [], "required": "Yes", "description": "Stream de datos del documento adjunto.", "sapStructure": ""}], "required": "Yes", "description": "Documento adjunto. En [BASE-64]. Contiene los documentos relacionados con la factura en el formato deseado (imagen, PDF, XML, etc.)", "sapStructure": ""}], "required": "No", "description": "Documentos asociados. Identificación de documentos Emisor/Receptor.", "sapStructure": ""}, {"name": "InvoiceAdditionalInformation", "type": "TextMax2500Type", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/InvoiceAdditionalInformation", "isLeaf": true, "children": [], "required": "No", "description": "Información adicional. Lo que considere oportuno el Emisor. En este elemento se recogerá el motivo por lo que el impuesto correspondiente está \\"no sujeto\\" o \\"exento\\", cuando se produzca esta situación.", "sapStructure": ""}, {"name": "Extensions", "type": "ExtensionsType", "xpath": "/Facturae/Invoices/Invoice/AdditionalData/Extensions", "isLeaf": false, "children": [], "required": "No", "description": "Extensiones. Podrán incorporarse nuevas definiciones estructuradas cuando sean de interés conjunto para emisores y receptores, y no estén ya definidas en el esquema de la factura.", "sapStructure": ""}], "required": "No", "description": "Datos adicionales.", "sapStructure": ""}], "required": "Yes", "description": "Factura.", "sapStructure": ""}], "required": "Yes", "description": "Conjunto de facturas que contiene el fichero. Conjunto de facturas que contiene el fichero. Para todos los elementos numéricos, los cálculos se efectuarán siempre redondeando al número de decimales correspondientes.", "sapStructure": ""}, {"name": "Extensions", "type": "ExtensionsType", "xpath": "/Facturae/Extensions", "isLeaf": false, "children": [], "required": "No", "description": "Extensiones. Podrán incorporarse nuevas definiciones estructuradas cuando sean de interés conjunto para emisores y receptores, y no estén ya definidas en el esquema de la factura.", "sapStructure": ""}, {"name": "Signature", "type": "Ref: ds:Signature", "xpath": "/Facturae/Signature", "isLeaf": true, "children": [], "required": "No", "description": "External Reference", "sapStructure": ""}], "required": "Yes", "description": "Elemento ORIGEN de Fichero de Facturas Facturae.", "sapStructure": ""}], "aiContext": {"name": "TaxIdentificationNumber", "type": "TextMin3Max30Type", "isBusy": false, "userQuery": "¿Qué valor me recomiendas incluir en este campo?", "targetPath": "/root/0/children/1/children/0/children/0/children/2", "description": "Código de Identificación Fiscal del sujeto. Se trata de las composiciones de NIF/CIF que marca la Administración correspondiente (precedidas de las dos letras del país en el caso de operaciones intracomunitarias, es decir, cuando comprador y vendedor tienen domicilio fiscal en estados miembros de la UE distintos).", "recommendation": "Recomendación: STCEG\\n\\nRazonamiento: El campo STCEG (Número de identificación fiscal) es el estándar en SAP para almacenar el VAT Registration Number. Coincide con la descripción ya que permite incluir el prefijo de dos letras del país para operaciones intracomunitarias (NIF-IVA) y tiene una longitud compatible. Se recomienda mapear aquí el NIF/CIF del emisor o receptor según corresponda el flujo del IDoc.", "suggestedValue": "STCEG"}}
\.


--
-- Data for Name: emisor; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.emisor (id_emisor, nombre, nif, direccion, email, telefono, created_at, updated_at) FROM stdin;
4ffd552c-4ca4-4b99-a905-eb8297b185fe	Carlos Iván Prieto Rubio	2343243424	Avda. de Europa 1, edificio B	carlos.prieto@t4sadvance.com	638667723	2025-11-24 20:12:04.03637	2025-11-24 20:12:04.03637
70a74cd4-219d-48a7-b3e0-ac9dde3dcc11	REPSOL	B00199232	Mendez Alvaro	test@repsol.com	918829923	2025-11-26 15:40:25.044234	2025-11-26 15:40:25.044234
ccf29ab1-25b2-4993-81d8-28cc74198e9d	Moeve	r4342334234	Test	test@moeve.com	765464564	2025-11-26 15:40:25.044234	2025-11-26 15:40:25.044234
9f28fb45-6d29-4b12-a448-f860261e00e8	T4S Advanced	B16744690	Avenida Europa 1	test@t4sadvance.com	91828323	2025-11-24 23:05:02.774205	2026-01-24 10:44:06.497478
4a05c69c-552c-403a-9cc0-051f53d2287e	SAP INTEGRATION TEST SL	B12345678	Calle Test 123	\N	\N	2026-01-25 20:08:46.876403	2026-01-25 20:08:46.876403
\.


--
-- Data for Name: factura; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.factura (id_factura, numero, serie, fecha_emision, fecha_vencimiento, id_emisor, id_receptor, estado, metodo_pago, subtotal, impuestos_totales, total, xml_path, pdf_path, created_at, updated_at, tipo, codigo_tipo, id_origen, fecha_operacion, invoice_country_id, external_process_id) FROM stdin;
0708d2aa-8870-4229-98b1-c0665b7a7ab8	INV-FR-000000000001		2026-01-19	2026-01-19	9f28fb45-6d29-4b12-a448-f860261e00e8	77ed7abd-7bc5-4c5d-9f69-8f5b69d12d49	BORRADOR	\N	17000.00	3570.00	20570.00	\N	\N	2026-01-19 22:57:20.803712	2026-01-19 22:57:20.803712	ISSUE	01	1	\N	3	\N
ecc69318-4273-48f4-ad16-ebddde2783b9	INV-ISUE-00000000045		2026-01-19	2026-01-19	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	100.00	21.00	121.00	\N	\N	2026-01-19 22:00:47.569782	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	3	\N
cec07a99-d55d-42ba-8831-7f1133448466	INV-ISUE-00000000047		2026-01-19	2026-01-19	9f28fb45-6d29-4b12-a448-f860261e00e8	77ed7abd-7bc5-4c5d-9f69-8f5b69d12d49	BORRADOR	\N	6000.00	1260.00	7260.00	\N	\N	2026-01-19 22:15:25.28863	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	3	\N
e70e420c-13c3-412b-9bae-eefff6b53c44	INV-ISUE-00000000025		2025-10-28	2025-12-20	9f28fb45-6d29-4b12-a448-f860261e00e8	91b02399-fd7f-404b-911d-c959b8a008f9	BORRADOR	TRANSFERENCIA	55.83	2.88	58.71	\N	\N	2025-12-02 18:07:06.476006	2026-01-23 22:04:02.333626	ISSUE	02	3	\N	1	\N
a6fbb99b-26f0-4254-b22b-02cc2c796761	INV-ISUE-00000000026	2123213	2025-11-24	2025-11-27	4ffd552c-4ca4-4b99-a905-eb8297b185fe	91b02399-fd7f-404b-911d-c959b8a008f9	EMITIDA	TRANSFERENCIA	3200.00	672.00	3872.00	\N	\N	2025-11-24 23:01:44.43798	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
b2ea6cec-4f0a-44b7-a461-f67ec9fe6b95	INV-ISUE-00000000027	123123	2025-11-24	2025-12-31	4ffd552c-4ca4-4b99-a905-eb8297b185fe	91b02399-fd7f-404b-911d-c959b8a008f9	EMITIDA	TRANSFERENCIA	2400.00	504.00	2904.00	\N	\N	2025-11-24 22:56:15.262124	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
f01ea88e-b76d-44a3-9e78-94eaaa1ff5a0	INV-ISUE-00000000028	22220	2025-11-24	2025-11-26	4ffd552c-4ca4-4b99-a905-eb8297b185fe	91b02399-fd7f-404b-911d-c959b8a008f9	EMITIDA	TARJETA	4620.00	970.20	5590.20	\N	\N	2025-11-24 20:38:55.292093	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
f9c68c8a-ba8f-452e-9253-9b075bd6c3b5	INV-ISUE-00000000029		2025-11-24	2025-11-28	70a74cd4-219d-48a7-b3e0-ac9dde3dcc11	9a76e580-0aaa-445e-bb22-cf354dd5b224	BORRADOR	TARJETA	3200.00	672.00	3872.00	\N	\N	2025-11-26 17:01:49.883214	2026-01-23 22:04:02.333626	ISSUE	02	3	\N	1	\N
4977209e-c118-4a03-8ecf-cfc7c90f98ac	INV-ISUE-00000000030	123213	2025-11-25	2025-11-26	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	ENVIADA	TRANSFERENCIA	150.00	31.50	181.50	\N	\N	2025-11-25 09:49:47.565811	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
aabb8628-2a25-4fbf-8d05-ae11edf2b1b0	INV-ISUE-00000000031		2025-11-25	2025-11-29	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	ADEUDO_SEPA	150.00	31.50	181.50	\N	\N	2025-11-26 15:47:45.750068	2026-01-23 22:04:02.333626	ISSUE	02	1	\N	1	\N
de2084a2-61b9-452f-9718-50a590de36ca	INV-ISUE-00000000032		2025-11-25	2025-11-26	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	FIRMADA	TRANSFERENCIA	150.00	31.50	181.50	\N	\N	2025-11-26 15:32:22.861147	2026-01-23 22:04:02.333626	ISSUE	02	1	\N	1	\N
12edd37f-6aa2-4806-a65a-a14bc45c82c9	INV-ISUE-00000000021		2020-09-28	2025-12-07	9f28fb45-6d29-4b12-a448-f860261e00e8	9af4c53e-ffd0-4af2-aca0-a77a99adf272	BORRADOR	TRANSFERENCIA	24.75	1.00	25.75	\N	\N	2025-11-26 23:04:19.57919	2026-01-23 22:04:02.333626	ISSUE	02	3	\N	1	\N
8ce653c1-cf80-4dba-9286-ca2adbd3a498	INV-ISUE-00000000022		2025-08-08	2025-11-28	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	TRANSFERENCIA	60000.00	12600.00	72600.00	\N	\N	2025-11-26 13:10:55.901135	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
c8a266e8-70c5-4c75-acd2-cedc3ae6569c	INV-ISUE-00000000023		2025-08-08	2025-11-27	ccf29ab1-25b2-4993-81d8-28cc74198e9d	9a76e580-0aaa-445e-bb22-cf354dd5b224	BORRADOR	TRANSFERENCIA	60000.00	12600.00	72600.00	\N	\N	2025-11-26 16:19:22.517348	2026-01-23 22:04:02.333626	ISSUE	02	1	\N	1	\N
3340bc21-615d-4789-91ea-4b10e7ea95e3	INV-ISUE-00000000024		2025-09-12	2025-11-26	9f28fb45-6d29-4b12-a448-f860261e00e8	9af4c53e-ffd0-4af2-aca0-a77a99adf272	PAGADA	TRANSFERENCIA	96.56	9.66	106.22	\N	\N	2025-11-26 16:30:30.48355	2026-01-23 22:04:02.333626	ISSUE	02	1	\N	1	\N
79aa8b6f-3f57-4f15-b865-ff4eaf3e5ddc	INV-ISUE-00000000033		2025-11-26	2025-11-27	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	TRANSFERENCIA	1200.00	252.00	1452.00	\N	\N	2025-11-26 15:45:44.374424	2026-01-23 22:04:02.333626	ISSUE	02	1	\N	1	\N
9f93f60a-a1d2-4156-8444-bd1e8ff7a9e4	INV-ISUE-00000000034		2025-11-26	2025-12-20	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	EMITIDA	CONTADO	4800.00	1008.00	5808.00	\N	\N	2025-11-26 15:51:46.297079	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
a8e0d20d-aad0-49a8-b602-0f124c2e990d	INV-ISUE-00000000035		2025-11-26	2025-11-29	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	BORRADOR	TRANSFERENCIA	800.00	168.00	968.00	\N	\N	2025-11-27 16:07:19.35459	2026-01-23 22:04:02.333626	ISSUE	02	3	\N	1	\N
e365721d-f75d-4524-b2c7-25d887c54174	INV-ISUE-00000000036		2025-11-26	2025-12-05	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	ENVIADA	CONTADO	800.00	168.00	968.00	\N	\N	2025-11-26 23:02:47.497363	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
438ecd18-0c90-4a8c-85db-6bd678e5f7da	INV-ISUE-00000000037		2025-12-02	2025-12-28	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	TRANSFERENCIA	450.00	94.50	544.50	\N	\N	2025-12-02 18:03:30.965748	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
b4a517c4-cf2b-494b-bf3c-c242bf2a82a2	SAP001	TEST	2023-11-01	\N	4a05c69c-552c-403a-9cc0-051f53d2287e	7f9718fb-3337-49b1-8446-b03d8d3a5e72	BORRADOR	\N	100.00	21.00	121.00	\N	\N	2026-01-25 20:08:46.876403	2026-01-25 20:08:46.876403	ISSUE	01	7	\N	1	SAP_TEST_1769368126764
ed645057-d217-457e-a930-bb6d4d816c3b	INV-SAP-00000000002	A	2026-01-23	\N	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	\N	3000.00	630.00	3630.00	\N	\N	2026-01-25 20:35:14.751385	2026-01-25 20:35:14.751385	ISSUE	01	7	\N	1	INV-SAP-00000000002
f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4	INV-ISUE-00000000050		2026-01-25	2026-01-25	9f28fb45-6d29-4b12-a448-f860261e00e8	7f9718fb-3337-49b1-8446-b03d8d3a5e72	FIRMADA	\N	10000.00	2100.00	12100.00	uploads/signed_invoice_f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4_1769372769798.xml	\N	2026-01-25 21:22:55.776282	2026-01-25 21:26:09.802196	ISSUE	01	1	\N	1	\N
77e47e21-62bd-4be8-965a-da377eedda4a	INV-ISUE-00000000038		2025-12-06	2025-12-07	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	BORRADOR	TRANSFERENCIA	4360.00	915.60	5275.60	\N	\N	2025-11-27 12:03:12.597878	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
d5b558a9-db39-4237-840d-489f56183f32	INV-ISUE-00000000039		2025-12-06	2025-12-07	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	BORRADOR	TRANSFERENCIA	1200.00	252.00	1452.00	\N	\N	2025-11-27 11:59:11.458708	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
cf21054a-bc3b-487d-91af-1f27ad0a8e12	INV-ISUE-00000000030		2025-12-10	2025-12-10	9f28fb45-6d29-4b12-a448-f860261e00e8	0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	BORRADOR	\N	320.00	32.00	352.00	\N	\N	2025-12-10 01:11:26.585756	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
369dd89c-c177-4b60-9b89-de04a558470d	INV-ISUE-00000000040		2025-12-10	2025-12-10	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	\N	2400.00	240.00	2640.00	\N	\N	2025-12-10 09:48:24.760224	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
2aac25fe-d9c2-424c-9433-be109080610a	INV-ISUE-00000000041		2025-12-10	2025-12-10	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	3180.00	337.80	3517.80	\N	\N	2025-12-10 18:03:37.752752	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
b21b9e36-50eb-4e12-a932-f1f94509c91b	INV-ISUE-00000000042		2025-12-10	2025-12-10	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	600.00	126.00	726.00	\N	\N	2025-12-10 18:10:46.236105	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
fd4e3697-4bea-47b4-a951-537d1b958367	INV-ISUE-00000000043		2025-12-30	2025-12-30	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	180000.00	37800.00	217800.00	\N	\N	2025-12-30 12:51:56.355001	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
a6e4ca59-9ea6-4622-800b-a50405233379	INV-ISUE-00000000044		2025-12-30	2025-12-30	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	12000.00	2520.00	14520.00	\N	\N	2025-12-30 13:02:29.212706	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	1	\N
ba34d2b0-8fe8-45ca-b554-06bcd18a2a3d	INV-ISUE-00000000046		2026-01-19	2026-01-19	9f28fb45-6d29-4b12-a448-f860261e00e8	1bf0ae00-8719-4211-aeba-a770dabb57a1	BORRADOR	\N	6000.00	1260.00	7260.00	\N	\N	2026-01-19 22:08:18.603654	2026-01-23 22:04:02.333626	ISSUE	01	1	\N	3	\N
954c89ca-f278-41e6-824f-cdc5fd4261ae	INV-ISUE-00000000049	A	2026-01-23	\N	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	BORRADOR	\N	3000.00	630.00	3630.00	\N	\N	2026-01-25 20:32:16.211254	2026-01-25 20:32:16.211254	ISSUE	01	7	\N	1	INV-SAP-00000000001
d64f1da0-61ab-4cb1-a58c-1b2efa4e283d	INV-SAP-00000000003	A	2026-01-23	\N	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	FIRMADA	\N	3000.00	630.00	3630.00	uploads/signed_invoice_d64f1da0-61ab-4cb1-a58c-1b2efa4e283d_1769371775952.xml	\N	2026-01-25 20:56:05.928705	2026-01-25 21:09:35.953491	ISSUE	01	7	\N	1	INV-SAP-00000000003
f7e0172b-4749-4879-8124-b43afab90f98	INV-ISUE-00000000049		2026-01-24	2026-01-24	9f28fb45-6d29-4b12-a448-f860261e00e8	f5720462-0cea-4c89-a628-82b491083030	FIRMADA	\N	3000.00	630.00	3630.00	uploads/signed_invoice_f7e0172b-4749-4879-8124-b43afab90f98_1769434870860.xml	\N	2026-01-24 10:45:25.544991	2026-01-26 14:41:10.862139	ISSUE	01	1	\N	1	\N
76a7bfa3-c238-4f6d-ab05-e0eae7a443ca	INV-ISUE-00000000048		2026-01-19	2026-01-19	9f28fb45-6d29-4b12-a448-f860261e00e8	77ed7abd-7bc5-4c5d-9f69-8f5b69d12d49	FIRMADA	\N	2000.00	420.00	2420.00	uploads/signed_invoice_76a7bfa3-c238-4f6d-ab05-e0eae7a443ca_1769503599045.xml	\N	2026-01-19 22:16:52.003978	2026-01-27 09:46:39.047218	ISSUE	01	1	\N	1	\N
\.


--
-- Data for Name: fiscal_models; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.fiscal_models (id, user_id, model_type, year, period, status, data, created_at, updated_at) FROM stdin;
242451e0-2269-4534-83e0-f9bdaa11a254	\N	303	2025	1T	DRAFT	{"nif": "676673624723", "year": "2025", "period": "1T", "chk_sii": true, "companyName": "TEST", "final_result": 0, "chk_criterion": true, "chk_bankruptcy": false, "total_deducible": 0, "total_devengado": 0, "devengado_general": [{"base": "2000", "rate": 21, "quota": 0}, {"base": "100000", "rate": 10, "quota": 0}, {"base": "89003", "rate": 4, "quota": 0}], "result_difference": 0, "prev_period_result": 0, "deducible_intra_base": 0, "recargo_equivalencia": [{"base": 0, "rate": 5.2, "quota": 0}, {"base": 0, "rate": 1.4, "quota": 0}], "deducible_assets_base": 0, "deducible_import_base": 0, "deducible_intra_quota": 0, "deducible_assets_quota": 0, "deducible_import_quota": "200000", "deducible_interior_base": 0, "deducible_interior_quota": 0}	2026-01-06 22:51:04.140996+01	2026-01-06 22:51:04.140996+01
\.


--
-- Data for Name: impuesto; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.impuesto (id_impuesto, codigo, descripcion, porcentaje, activo, created_at) FROM stdin;
71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	IVA21	IVA General 21%	21.00	t	2025-11-23 22:16:34.278406
9a80027c-ba54-4d9d-8733-2ade67a230a5	IVA10	IVA Reducido 10%	10.00	t	2025-11-23 22:16:34.278406
51ec0e14-f81e-4be9-8b40-48e36e80119e	IVA4	IVA Superreducido 4%	4.00	t	2025-11-23 22:16:34.278406
19659f3f-e588-4d47-aea7-636b814e7b98	IVA0	IVA Exento 0%	0.00	t	2025-11-23 22:16:34.278406
55a77072-bd0d-42ac-b60c-62e47b74a69f	IRPF15	IRPF 15% (Retención)	-15.00	t	2025-11-23 22:16:34.278406
efb2849f-a31f-473a-82c3-fd4584f540e9	IRPF7	IRPF 7% (Retención)	-7.00	t	2025-11-23 22:16:34.278406
\.


--
-- Data for Name: invoice_country; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.invoice_country (id, pais, region) FROM stdin;
4	Bélgica	
3	Francia	
2	Polonia	
1	España	
5	España	País Vasco
6	España	FACE
\.


--
-- Data for Name: linea_factura; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.linea_factura (id_linea, id_factura, descripcion, cantidad, precio_unitario, porcentaje_impuesto, importe_impuesto, total_linea, id_impuesto, created_at) FROM stdin;
032bbc85-7cb1-460b-bce1-39ba2c5056ab	f01ea88e-b76d-44a3-9e78-94eaaa1ff5a0	Gasoleo 20	2.00	2300.00	21.00	966.00	5566.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-24 20:38:55.292093
5a77a769-9998-4a9c-aba7-dcaee4fbfbee	f01ea88e-b76d-44a3-9e78-94eaaa1ff5a0	Quimicos	1.00	20.00	21.00	4.20	24.20	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-24 20:38:55.292093
b2a470af-b41a-4ed5-9aa1-9d554eb947e1	b2ea6cec-4f0a-44b7-a461-f67ec9fe6b95	Auditoría de Seguridad	2.00	1200.00	21.00	504.00	2904.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-24 22:56:15.262124
9b96c82a-c0ed-4587-a393-bd074dcaba16	a6fbb99b-26f0-4254-b22b-02cc2c796761	Auditoría de Seguridad	1.00	1200.00	21.00	252.00	1452.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-24 23:01:44.43798
9677654c-65ff-4ff3-9721-8afcdaea52a4	a6fbb99b-26f0-4254-b22b-02cc2c796761	Migración a la Nube	1.00	2000.00	21.00	420.00	2420.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-24 23:01:44.43798
aaccca73-fa86-419d-a5a0-34f8a060592d	4977209e-c118-4a03-8ecf-cfc7c90f98ac	Desarrollo de Software (Por hora)	1.00	150.00	21.00	31.50	181.50	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-25 09:49:47.565811
3a012fed-df11-42e4-a8f0-0e2832aa46df	8ce653c1-cf80-4dba-9286-ca2adbd3a498	Consultor JP SAP	50.00	1200.00	21.00	12600.00	72600.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 13:10:55.901135
244261a7-322c-44aa-a4c1-ba3163d010fe	de2084a2-61b9-452f-9718-50a590de36ca	Desarrollo de Software (Por hora)	1.00	150.00	21.00	31.50	181.50	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 15:32:22.861147
ac9acbda-8b5a-4d81-8d35-88078b7c2488	79aa8b6f-3f57-4f15-b865-ff4eaf3e5ddc	Auditoría de Seguridad	1.00	1200.00	21.00	252.00	1452.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 15:45:44.374424
07447e90-8d71-455f-b4ff-7d2a02b6c59b	aabb8628-2a25-4fbf-8d05-ae11edf2b1b0	Desarrollo de Software (Por hora)	1.00	150.00	21.00	31.50	181.50	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 15:47:45.750068
dd9d52e0-91d1-4893-a4fa-d9c578c16012	9f93f60a-a1d2-4156-8444-bd1e8ff7a9e4	Migración a la Nube	2.00	2000.00	21.00	840.00	4840.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 15:51:46.297079
7a753980-8dce-4afd-b70f-c7c4dd84d809	9f93f60a-a1d2-4156-8444-bd1e8ff7a9e4	Sesión de Formación de Personal	1.00	800.00	21.00	168.00	968.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 15:51:46.297079
22c17d2e-a0ed-4f33-adf8-b997779a1b81	c8a266e8-70c5-4c75-acd2-cedc3ae6569c	Consultor^>a JP SAP	50.00	1200.00	21.00	12600.00	72600.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 16:19:22.517348
e5adff7e-2470-4d74-a5d5-9a3252cc7b21	3340bc21-615d-4789-91ea-4b10e7ea95e3	Habitación	1.00	96.56	10.00	9.66	106.22	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-11-26 16:30:30.48355
b6d9a0bb-ba81-4737-819f-671ac0abeeed	f9c68c8a-ba8f-452e-9253-9b075bd6c3b5	Migración a la Nube	1.00	2000.00	21.00	420.00	2420.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 17:01:49.883214
1657699e-f38c-419c-915f-fbdb9bf86573	f9c68c8a-ba8f-452e-9253-9b075bd6c3b5	Auditoría de Seguridad	1.00	1200.00	21.00	252.00	1452.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 17:01:49.883214
ab66f709-ee52-4e07-9ff9-20d77dbce054	e365721d-f75d-4524-b2c7-25d887c54174	HW-MOU-004	10.00	80.00	21.00	168.00	968.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-26 23:02:47.497363
9e2aa9d6-b9a1-4012-b624-1e3aa6edb3aa	12edd37f-6aa2-4806-a65a-a14bc45c82c9	N° 33 Retro Gamer	1.00	6.95	4.00	0.28	7.23	51ec0e14-f81e-4be9-8b40-48e36e80119e	2025-11-26 23:04:19.57919
25811f7c-923c-49b2-85d1-77550663eac3	12edd37f-6aa2-4806-a65a-a14bc45c82c9	Pack nº 8 (Incluye n° 21 y 22 de Retro Gamer)	1.00	8.90	4.00	0.36	9.26	51ec0e14-f81e-4be9-8b40-48e36e80119e	2025-11-26 23:04:19.57919
be72294b-2f45-4ec2-bf5f-c345ac33cf0c	12edd37f-6aa2-4806-a65a-a14bc45c82c9	Pack nº 6 (Incluye n° 17 y 18 de Retro Gamer)	1.00	8.90	4.00	0.36	9.26	51ec0e14-f81e-4be9-8b40-48e36e80119e	2025-11-26 23:04:19.57919
91431ed1-8397-4f49-bb56-8b5c09dd4123	d5b558a9-db39-4237-840d-489f56183f32	JP T4S Advance	1.00	1200.00	21.00	252.00	1452.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-27 11:59:11.458708
a8c7efae-1f1d-42bd-b450-79f94e652dc3	77e47e21-62bd-4be8-965a-da377eedda4a	Teclado Mecánico	20.00	150.00	21.00	630.00	3630.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-27 12:03:12.597878
5ae2e194-581b-4a96-a896-32b5f8672804	77e47e21-62bd-4be8-965a-da377eedda4a	Ratón Ergonómico Inalámbrico	17.00	80.00	21.00	285.60	1645.60	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-27 12:03:12.597878
102fbeb9-18e7-4040-9379-81ecb7722c69	a8e0d20d-aad0-49a8-b602-0f124c2e990d	HW-MOU-004	10.00	80.00	21.00	168.00	968.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-11-27 16:07:19.35459
6cb03688-3e17-4ee3-b83d-2c72baa1b9fd	438ecd18-0c90-4a8c-85db-6bd678e5f7da	Monitor 4K de 27 pulgadas	1.00	300.00	21.00	63.00	363.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-02 18:03:30.965748
f1809db8-69d0-4f74-a328-c77c615c3e12	438ecd18-0c90-4a8c-85db-6bd678e5f7da	Teclado Mecánico	1.00	150.00	21.00	31.50	181.50	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-02 18:03:30.965748
f0365ecb-b8e6-4403-83ce-9c26762077ab	e70e420c-13c3-412b-9bae-eefff6b53c44	CUOTA DE SERVICIO	1.00	20.49	10.00	2.05	22.54	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-02 18:07:06.476006
8a17750f-2b7d-4cd2-837e-9b4d1969bbcb	e70e420c-13c3-412b-9bae-eefff6b53c44	CONSUMO De 1 a 12 m3	12.00	0.19	10.00	0.23	2.51	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-02 18:07:06.476006
ab1137fb-c005-4b2e-a702-9c52d10a1bda	e70e420c-13c3-412b-9bae-eefff6b53c44	CONSUMO De 13 a 33 m3	9.00	0.67	10.00	0.60	6.63	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-02 18:07:06.476006
5ebbb776-702c-4dad-8ba5-cb3e8a8a1136	e70e420c-13c3-412b-9bae-eefff6b53c44	CONSUMO VERTIDOS De 1 a 12 m3	12.00	0.25	0.00	0.00	3.00	19659f3f-e588-4d47-aea7-636b814e7b98	2025-12-02 18:07:06.476006
f57ba14b-2659-4409-a3bf-1a118f7ab7d7	e70e420c-13c3-412b-9bae-eefff6b53c44	CONSUMO VERTIDOS Más de 12 m3	9.00	0.41	0.00	0.00	3.69	19659f3f-e588-4d47-aea7-636b814e7b98	2025-12-02 18:07:06.476006
e54f0aac-920b-4980-8828-7efd461b52cd	e70e420c-13c3-412b-9bae-eefff6b53c44	RECOGIDA DE BASURA 04-Epígrafe 1-Categoría 4	1.00	19.40	0.00	0.00	19.40	19659f3f-e588-4d47-aea7-636b814e7b98	2025-12-02 18:07:06.476006
2ff58410-65e0-4165-b1c0-bf713f713803	e70e420c-13c3-412b-9bae-eefff6b53c44	CUOTA	1.00	0.56	0.00	0.00	0.56	19659f3f-e588-4d47-aea7-636b814e7b98	2025-12-02 18:07:06.476006
b6884c71-42f7-46f6-bb3e-8104f6176556	e70e420c-13c3-412b-9bae-eefff6b53c44	CONSUMO De 3 a 10m3/mes	15.00	0.03	0.00	0.00	0.38	19659f3f-e588-4d47-aea7-636b814e7b98	2025-12-02 18:07:06.476006
4a1c679b-4236-4da1-932e-bae14193910d	cf21054a-bc3b-487d-91af-1f27ad0a8e12	Cámara Web HD 1080p	1.00	120.00	10.00	12.00	132.00	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-10 01:11:26.585756
6fd37b56-ad98-4c37-afdf-33801ee51ce4	cf21054a-bc3b-487d-91af-1f27ad0a8e12	Auriculares con Cancelación de Ruido	1.00	200.00	10.00	20.00	220.00	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-10 01:11:26.585756
3d5a03d9-0c15-4f64-8b34-52b28a98627b	369dd89c-c177-4b60-9b89-de04a558470d	JP T4S Advance	2.00	1200.00	10.00	240.00	2640.00	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-10 09:48:24.760224
dc6986d2-7e5d-4c22-836a-8ecfbc95433f	2aac25fe-d9c2-424c-9433-be109080610a	Estación de Acoplamiento USB-C	1.00	180.00	21.00	37.80	217.80	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-10 18:03:37.752752
cae2c357-6664-4c49-b31b-48c31b084a60	2aac25fe-d9c2-424c-9433-be109080610a	Monitor 4K de 27 pulgadas	10.00	300.00	10.00	300.00	3300.00	9a80027c-ba54-4d9d-8733-2ade67a230a5	2025-12-10 18:03:37.752752
815dec22-bfeb-423d-afb6-427e2a9103d6	b21b9e36-50eb-4e12-a932-f1f94509c91b	Tablet Pro 11"	1.00	600.00	21.00	126.00	726.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-10 18:10:46.236105
cae28d4b-727e-48d4-95a8-7a15888e0bec	fd4e3697-4bea-47b4-a951-537d1b958367	Desarrollo de Software (Por hora)	1200.00	150.00	21.00	37800.00	217800.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-30 12:51:56.355001
c5cd39ea-c039-494e-b7d3-c160888bf1f9	a6e4ca59-9ea6-4622-800b-a50405233379	JP T4S Advance	10.00	1200.00	21.00	2520.00	14520.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2025-12-30 13:02:29.212706
fdbeee54-f00c-4864-bb1a-cc8c377b76ea	ecc69318-4273-48f4-ad16-ebddde2783b9	Disco Duro Externo 2TB	1.00	100.00	21.00	21.00	121.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:00:47.569782
9907c460-06d5-4aa4-a620-12b7df23286f	ba34d2b0-8fe8-45ca-b554-06bcd18a2a3d	Tablet Pro 11"	10.00	600.00	21.00	1260.00	7260.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:08:18.603654
aeb7a1fb-930a-49e3-bef5-3919187a6b23	cec07a99-d55d-42ba-8831-7f1133448466	Monitor 4K de 27 pulgadas	20.00	300.00	21.00	1260.00	7260.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:15:25.28863
f9c22508-d2a8-4135-aa3f-afc1a105feec	76a7bfa3-c238-4f6d-ab05-e0eae7a443ca	Disco Duro Externo 2TB	20.00	100.00	21.00	420.00	2420.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:16:52.003978
958958e2-4f6c-45c4-8704-518b36554d64	0708d2aa-8870-4229-98b1-c0665b7a7ab8	Ratón Ergonómico Inalámbrico	200.00	80.00	21.00	3360.00	19360.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:57:20.803712
34eea6ae-5a5d-4a5a-a964-7fc37058f186	0708d2aa-8870-4229-98b1-c0665b7a7ab8	Disco Duro Externo 2TB	10.00	100.00	21.00	210.00	1210.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-19 22:57:20.803712
7e01d17b-a5b4-4336-851e-911ba67e92e6	f7e0172b-4749-4879-8124-b43afab90f98	Monitor 4K de 27 pulgadas	10.00	300.00	21.00	630.00	3630.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-24 10:45:25.544991
3253bc7d-1a39-4f20-9978-ce7af019903b	b4a517c4-cf2b-494b-bf3c-c242bf2a82a2	Producto Prueba SAP	1.00	100.00	21.00	21.00	100.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-25 20:08:46.876403
6548ac4f-9c7d-42bb-b718-d2cac2462a7e	954c89ca-f278-41e6-824f-cdc5fd4261ae	Monitor 4K de 27 pulgadas	10.00	300.00	21.00	762.30	3630.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-25 20:32:16.211254
3f6884df-dfc0-49ba-b9a8-58e8392a179d	ed645057-d217-457e-a930-bb6d4d816c3b	Monitor 4K de 27 pulgadas	10.00	300.00	21.00	762.30	3630.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-25 20:35:14.751385
99723b06-e51c-4399-983d-ad1522ede049	d64f1da0-61ab-4cb1-a58c-1b2efa4e283d	Monitor 4K de 27 pulgadas	10.00	300.00	21.00	762.30	3630.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-25 20:56:05.928705
b71a9dfd-81ae-4f80-ae2f-66881594a4fb	f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4	Consultoría TI (Por hora)	100.00	100.00	21.00	2100.00	12100.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	2026-01-25 21:22:55.776282
\.


--
-- Data for Name: log_factura; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.log_factura (id_log, id_factura, fecha, accion, detalle, usuario) FROM stdin;
7dcd34d2-afee-4bdd-9157-6f4a3c9d6cc3	f01ea88e-b76d-44a3-9e78-94eaaa1ff5a0	2025-11-24 20:38:55.292093	CREADA	\N	test@example.com
c59a6eab-442c-4fa6-ba00-6cd010536d3e	f01ea88e-b76d-44a3-9e78-94eaaa1ff5a0	2025-11-24 20:39:03.585465	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a EMITIDA	\N
ad585d86-b916-455f-9756-7bfc12f0135f	b2ea6cec-4f0a-44b7-a461-f67ec9fe6b95	2025-11-24 22:56:15.262124	CREADA	\N	test@example.com
d8012b78-b6d7-4370-9bdf-37bb0ef88eb3	b2ea6cec-4f0a-44b7-a461-f67ec9fe6b95	2025-11-24 22:56:26.183243	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a EMITIDA	\N
30cf2d65-93c0-4e26-8027-70e1167cecfc	a6fbb99b-26f0-4254-b22b-02cc2c796761	2025-11-24 23:01:44.43798	CREADA	\N	test@example.com
103b8f7e-6d28-4e09-9785-80c894cde263	a6fbb99b-26f0-4254-b22b-02cc2c796761	2025-11-24 23:01:51.627237	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a EMITIDA	\N
f64728b2-c1e2-4841-a759-37975839821c	4977209e-c118-4a03-8ecf-cfc7c90f98ac	2025-11-25 09:49:47.565811	CREADA	\N	test@example.com
0964dbc5-5c18-4d9d-bfcc-7a0d1a347863	4977209e-c118-4a03-8ecf-cfc7c90f98ac	2025-11-25 09:50:08.74515	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a ENVIADA	\N
3ecba02f-12ea-4a4f-86b9-5a89080c0291	8ce653c1-cf80-4dba-9286-ca2adbd3a498	2025-11-26 13:10:55.901135	CREADA	\N	test@example.com
8513b7f0-cb09-4234-b749-5840400ddd45	de2084a2-61b9-452f-9718-50a590de36ca	2025-11-26 15:32:22.861147	CREADA	\N	test@example.com
610cfff2-c513-4eba-85c5-ef0f46266178	79aa8b6f-3f57-4f15-b865-ff4eaf3e5ddc	2025-11-26 15:45:44.374424	CREADA	\N	test@example.com
b8ffd724-b4ad-4169-9bb2-2ecebd3d73ed	aabb8628-2a25-4fbf-8d05-ae11edf2b1b0	2025-11-26 15:47:45.750068	CREADA	\N	test@example.com
2b3ccc6f-1f8d-4c6a-997c-8c77e5fb07bf	9f93f60a-a1d2-4156-8444-bd1e8ff7a9e4	2025-11-26 15:51:46.297079	CREADA	\N	test@example.com
7834c9cf-1ff0-4d76-b958-6d4fdda66927	9f93f60a-a1d2-4156-8444-bd1e8ff7a9e4	2025-11-26 15:51:51.764799	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a EMITIDA	\N
b4bdfd4d-5c7e-456a-b987-3e6c8459febd	c8a266e8-70c5-4c75-acd2-cedc3ae6569c	2025-11-26 16:19:22.517348	CREADA	\N	test@example.com
e9665037-61e5-426e-b982-195d62ab6faf	3340bc21-615d-4789-91ea-4b10e7ea95e3	2025-11-26 16:30:30.48355	CREADA	\N	test@example.com
8b86fda8-1929-4834-bce4-00403285d022	3340bc21-615d-4789-91ea-4b10e7ea95e3	2025-11-26 16:30:40.417053	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a PAGADA	\N
c225a7a8-ae16-427d-9156-c3a27ef14f3e	f9c68c8a-ba8f-452e-9253-9b075bd6c3b5	2025-11-26 17:01:49.883214	CREADA	\N	test@example.com
d027a44c-bd35-4855-abd0-f6cd651e83d0	de2084a2-61b9-452f-9718-50a590de36ca	2025-11-26 22:02:23.70961	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a FIRMADA	\N
19491d29-f5f5-4ca7-93e3-58e023032e57	e365721d-f75d-4524-b2c7-25d887c54174	2025-11-26 23:02:47.497363	CREADA	\N	test@example.com
084de0ad-9e19-4b6d-b79a-0d5342329782	e365721d-f75d-4524-b2c7-25d887c54174	2025-11-26 23:03:01.10062	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a ENVIADA	\N
4530239d-9991-4b70-90f3-9337c0f92c15	12edd37f-6aa2-4806-a65a-a14bc45c82c9	2025-11-26 23:04:19.57919	CREADA	\N	test@example.com
cb805f15-a2b3-4f50-a803-d5f6bc92e955	d5b558a9-db39-4237-840d-489f56183f32	2025-11-27 11:59:11.458708	CREADA	\N	test@example.com
57b0a25e-0f4d-4070-863e-3fdd06999d90	77e47e21-62bd-4be8-965a-da377eedda4a	2025-11-27 12:03:12.597878	CREADA	\N	test@example.com
27f14b67-ce8e-471a-9f76-996489546493	a8e0d20d-aad0-49a8-b602-0f124c2e990d	2025-11-27 16:07:19.35459	CREADA	\N	test@example.com
7f9dcae5-ef0e-4c21-8cba-e2fabaf65218	438ecd18-0c90-4a8c-85db-6bd678e5f7da	2025-12-02 18:03:30.965748	CREADA	\N	test@example.com
f222cff6-d939-44e6-9d77-b935323e74f5	e70e420c-13c3-412b-9bae-eefff6b53c44	2025-12-02 18:07:06.476006	CREADA	\N	test@example.com
b1995bde-ac29-4e6a-b07a-f3a900042caa	cf21054a-bc3b-487d-91af-1f27ad0a8e12	2025-12-10 01:11:26.585756	CREADA	\N	test@example.com
6362b2eb-8561-4859-a0ab-ac820e667e90	369dd89c-c177-4b60-9b89-de04a558470d	2025-12-10 09:48:24.760224	CREADA	\N	test@example.com
01c3d125-6d8b-42c5-8358-e9b7ac833eb7	2aac25fe-d9c2-424c-9433-be109080610a	2025-12-10 18:03:37.752752	CREADA	\N	test@example.com
f8450efe-defa-4816-94d5-4390b974a97a	b21b9e36-50eb-4e12-a932-f1f94509c91b	2025-12-10 18:10:46.236105	CREADA	\N	test@example.com
fbd462b8-cb0e-43a5-8ade-45fa5c83368e	fd4e3697-4bea-47b4-a951-537d1b958367	2025-12-30 12:51:56.355001	CREADA	\N	test@example.com
4c2ccfaf-ed59-4cce-9d51-850bd42e9ecb	a6e4ca59-9ea6-4622-800b-a50405233379	2025-12-30 13:02:29.212706	CREADA	\N	test@example.com
8337bed7-d22a-43ee-beee-d20616e0e582	ecc69318-4273-48f4-ad16-ebddde2783b9	2026-01-19 22:00:47.569782	CREADA	\N	test@example.com
91cf090d-11cc-4d65-b829-b0c04714ef69	ba34d2b0-8fe8-45ca-b554-06bcd18a2a3d	2026-01-19 22:08:18.603654	CREADA	\N	test@example.com
76170578-3dd1-4fb1-b6bd-9e669c682c09	cec07a99-d55d-42ba-8831-7f1133448466	2026-01-19 22:15:25.28863	CREADA	\N	test@example.com
670e6eb6-d06d-411d-8ee1-edb2792a12d2	76a7bfa3-c238-4f6d-ab05-e0eae7a443ca	2026-01-19 22:16:52.003978	CREADA	\N	test@example.com
f86b0e2b-bbfc-40d2-94fd-6fe867b65347	0708d2aa-8870-4229-98b1-c0665b7a7ab8	2026-01-19 22:57:20.803712	CREADA	\N	test@example.com
84bd8141-db86-4869-9860-3475740d6a7b	f7e0172b-4749-4879-8124-b43afab90f98	2026-01-24 10:45:25.544991	CREADA	\N	test@example.com
754f6494-b7e3-494d-92e5-e8955b171651	d64f1da0-61ab-4cb1-a58c-1b2efa4e283d	2026-01-25 21:09:35.953491	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a FIRMADA	\N
7bdbca92-67e2-40df-8216-c75d58333ef6	f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4	2026-01-25 21:22:55.776282	CREADA	\N	test@example.com
293c3303-387c-4104-b117-fb8629fd7e9c	f94d9796-a14d-4e45-a9e8-38d1a5f8e5f4	2026-01-25 21:26:09.802196	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a FIRMADA	\N
65ef49be-0d17-445e-bbbc-66b216bdf6bd	f7e0172b-4749-4879-8124-b43afab90f98	2026-01-26 14:41:10.862139	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a FIRMADA	\N
7d717bad-86e5-448b-9371-3d3557fdc3f4	76a7bfa3-c238-4f6d-ab05-e0eae7a443ca	2026-01-27 09:46:39.047218	ESTADO_CAMBIADO	Estado cambiado de BORRADOR a FIRMADA	\N
\.


--
-- Data for Name: origenes; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.origenes (id_origen, descripcion) FROM stdin;
1	Manual
2	Email
3	Scanner
4	API
6	Excels
7	SAP
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at) FROM stdin;
1	1	38328b41034ccc69b99e1909e1ea039fde1979473111012fe8feecaa18757664	2025-11-23 10:52:29.445	f	2025-11-23 09:52:29.447489
2	1	a894550e1da743b90456d00529566e5cd00f0b61ddc0b912a35e2f318428fd1e	2025-11-23 21:43:24.034	t	2025-11-23 20:43:24.035275
\.


--
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.producto (id_producto, sku, tipo, precio_base, id_impuesto, activo, creado_en, actualizado_en) FROM stdin;
8bae78b0-30b7-486d-8e95-bc3a74647a6d	HW-LAP-001	PRODUCTO	1200.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
b920284b-d7c3-4cdf-b2a7-bc77e501c603	HW-MON-002	PRODUCTO	300.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
7f1a1dce-1917-42fd-8047-3d4f48665e19	HW-KEY-003	PRODUCTO	150.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
d07de849-11b4-4358-801c-8f929aa676c8	HW-MOU-004	PRODUCTO	80.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
ea56e491-eb5f-4b1b-ae65-c7fb289dd0bf	HW-HDD-005	PRODUCTO	100.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
14b5da8c-6ad9-4dad-b376-31c7aca81b98	HW-CAM-006	PRODUCTO	120.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
df354bfb-fafb-4c57-a58b-8f67472478da	HW-HEA-007	PRODUCTO	200.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
4fcb44d7-6fd1-4336-b447-8ec16514817d	HW-DOC-008	PRODUCTO	180.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
89c7d8a6-774e-462d-8daf-6572a64caec6	HW-TAB-009	PRODUCTO	600.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
8a72029b-a95e-4546-90a5-d05f97051c75	HW-PRT-010	PRODUCTO	400.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
c4646a1c-9754-4992-83f5-389ed25b6cf1	SRV-CON-001	SERVICIO	100.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
caf4bc34-7e07-4db7-85cf-c91f10d2cdf1	SRV-DEV-002	SERVICIO	150.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
692b204b-1ab9-4f04-8b72-55bc7e571480	SRV-AUD-003	SERVICIO	1200.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
dc7bcf42-6d21-49df-8b97-edc14011cccb	SRV-MNT-004	SERVICIO	500.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
2d69517b-1688-4892-8513-792326f67afd	SRV-CLD-005	SERVICIO	2000.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
6793d55a-a21d-4377-82ac-38107b381e4f	SRV-TRA-006	SERVICIO	800.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
ebd236c9-b1db-49ca-80e2-545b1eb0726c	SRV-SEO-007	SERVICIO	600.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
4529f1ce-acf2-4c83-a1a7-cf033e3a848b	SRV-DBA-008	SERVICIO	130.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
d7451625-d2c0-4f98-bfe9-276e1876a0f6	SRV-NET-009	SERVICIO	110.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
d1e7cb51-8a0f-4b9c-947c-91e12f4b15f4	SRV-REC-010	SERVICIO	1500.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 22:36:02.56112	2025-11-24 22:36:02.56112
c9373766-e45c-4d4a-9db1-a98c035633a5	SRV-0123 	SERVICIO	1200.00	71bc634c-87d5-4fd4-be6b-a3cd8cbc6ec8	t	2025-11-24 23:07:42.225497	2025-11-24 23:07:42.225497
\.


--
-- Data for Name: producto_precio; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.producto_precio (id_precio, id_producto, codigo_pais, moneda, precio) FROM stdin;
86e4e8dc-e9ab-47f5-ba74-3bc4890bb22d	8bae78b0-30b7-486d-8e95-bc3a74647a6d	ES	EUR	1200.00
8a16af17-170e-4654-ad62-1d8823975c79	b920284b-d7c3-4cdf-b2a7-bc77e501c603	ES	EUR	300.00
74f2c2c3-883e-4a37-9a64-b24d2b580470	7f1a1dce-1917-42fd-8047-3d4f48665e19	ES	EUR	150.00
636f8839-930b-45de-a94e-b6880b2afefd	d07de849-11b4-4358-801c-8f929aa676c8	ES	EUR	80.00
c7ec21e6-b7e0-4c23-85f5-b7551c909648	ea56e491-eb5f-4b1b-ae65-c7fb289dd0bf	ES	EUR	100.00
a0443b59-d441-4ef9-a49e-7c0a06571daf	14b5da8c-6ad9-4dad-b376-31c7aca81b98	ES	EUR	120.00
bd493180-b106-4f82-a9c1-6d54c2ca5035	df354bfb-fafb-4c57-a58b-8f67472478da	ES	EUR	200.00
46c9f185-232c-4967-984e-f423ef7c0f59	4fcb44d7-6fd1-4336-b447-8ec16514817d	ES	EUR	180.00
82564859-e62b-43c4-8d89-6e9311adfb76	89c7d8a6-774e-462d-8daf-6572a64caec6	ES	EUR	600.00
81ab8462-67d6-47c7-9ae6-75e1cfb271cb	8a72029b-a95e-4546-90a5-d05f97051c75	ES	EUR	400.00
5e72445e-2262-412b-b448-8be660bbf379	c4646a1c-9754-4992-83f5-389ed25b6cf1	ES	EUR	100.00
f6043e2e-9960-4bed-a2ce-0c35ad6a3592	caf4bc34-7e07-4db7-85cf-c91f10d2cdf1	ES	EUR	150.00
86190813-9d19-4167-97f4-26b25826fd7b	692b204b-1ab9-4f04-8b72-55bc7e571480	ES	EUR	1200.00
7232471c-6e0d-4021-8813-1088a3faabcc	dc7bcf42-6d21-49df-8b97-edc14011cccb	ES	EUR	500.00
b4897b77-df07-4112-a2ab-2b9da842b680	2d69517b-1688-4892-8513-792326f67afd	ES	EUR	2000.00
439dbde3-2787-4de4-a80b-f3171e86e74f	6793d55a-a21d-4377-82ac-38107b381e4f	ES	EUR	800.00
d1cd1702-188f-4a06-97fe-598646f8d44a	ebd236c9-b1db-49ca-80e2-545b1eb0726c	ES	EUR	600.00
ffdb3bc6-97a9-4509-b19b-596086fe5a25	4529f1ce-acf2-4c83-a1a7-cf033e3a848b	ES	EUR	130.00
0fc9ba52-363f-418b-8489-80a35b2804f0	d7451625-d2c0-4f98-bfe9-276e1876a0f6	ES	EUR	110.00
cd629278-87e1-4359-b527-31816352b88f	d1e7cb51-8a0f-4b9c-947c-91e12f4b15f4	ES	EUR	1500.00
\.


--
-- Data for Name: producto_traduccion; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.producto_traduccion (id_traduccion, id_producto, codigo_idioma, nombre, descripcion) FROM stdin;
f8b6e692-3a53-48ca-a68f-ec3a1301edcd	8bae78b0-30b7-486d-8e95-bc3a74647a6d	en	High-Performance Laptop	16GB RAM, 512GB SSD, i7 Processor
be49969a-9836-4ae4-94a0-9e86d2eb8a8e	8bae78b0-30b7-486d-8e95-bc3a74647a6d	es	Portátil de Alto Rendimiento	16GB RAM, 512GB SSD, Procesador i7
4b69e99f-e929-4700-b132-c8e7ee089584	b920284b-d7c3-4cdf-b2a7-bc77e501c603	en	27-inch 4K Monitor	IPS Panel, 60Hz, HDMI/DP
360fa308-31de-4d0f-b287-284c3e3061ea	b920284b-d7c3-4cdf-b2a7-bc77e501c603	es	Monitor 4K de 27 pulgadas	Panel IPS, 60Hz, HDMI/DP
45384764-07cf-446f-b296-456ef41a428b	7f1a1dce-1917-42fd-8047-3d4f48665e19	en	Mechanical Keyboard	RGB Backlit, Cherry MX Blue Switches
5689d7bb-95fc-4723-8f09-6040830c5be4	7f1a1dce-1917-42fd-8047-3d4f48665e19	es	Teclado Mecánico	Retroiluminación RGB, Switches Cherry MX Blue
314f60f6-f68e-42e1-a8a9-f722f7b245e3	d07de849-11b4-4358-801c-8f929aa676c8	en	Wireless Ergonomic Mouse	High precision, long battery life
3a0d66b5-9be4-417b-b51d-7841253be348	d07de849-11b4-4358-801c-8f929aa676c8	es	Ratón Ergonómico Inalámbrico	Alta precisión, larga duración de batería
20a46c4f-aa46-4e9b-8e65-e45d99f7f9bc	ea56e491-eb5f-4b1b-ae65-c7fb289dd0bf	en	External Hard Drive 2TB	USB 3.0, Portable
3badc0b7-a310-404f-a093-75794d957599	ea56e491-eb5f-4b1b-ae65-c7fb289dd0bf	es	Disco Duro Externo 2TB	USB 3.0, Portátil
cb887a16-9e84-484e-89d2-d1f2b39a1221	14b5da8c-6ad9-4dad-b376-31c7aca81b98	en	HD Webcam 1080p	With built-in microphone
71d68861-ffa3-4999-b5c9-027861cdab40	14b5da8c-6ad9-4dad-b376-31c7aca81b98	es	Cámara Web HD 1080p	Con micrófono integrado
7560492a-4f30-48d8-ae5a-d8ca72c8060e	df354bfb-fafb-4c57-a58b-8f67472478da	en	Noise Cancelling Headphones	Bluetooth 5.0, 30h battery
aff9d113-9751-475c-a96b-439c6fac3a26	df354bfb-fafb-4c57-a58b-8f67472478da	es	Auriculares con Cancelación de Ruido	Bluetooth 5.0, 30h batería
f9eba936-916e-477c-a5ea-aa34a04aca33	4fcb44d7-6fd1-4336-b447-8ec16514817d	en	USB-C Docking Station	HDMI, Ethernet, USB 3.0 ports
e16198f9-ec28-4377-b2dc-f58d5f999d89	4fcb44d7-6fd1-4336-b447-8ec16514817d	es	Estación de Acoplamiento USB-C	Puertos HDMI, Ethernet, USB 3.0
ee7e19b5-d574-4625-aa87-1e59bc9095a5	89c7d8a6-774e-462d-8daf-6572a64caec6	en	Tablet Pro 11"	128GB, Wi-Fi
7e8ed235-9e1e-47a2-bda6-5020346ab7db	89c7d8a6-774e-462d-8daf-6572a64caec6	es	Tablet Pro 11"	128GB, Wi-Fi
844f37f2-8950-47f2-9320-1b498e2d7578	8a72029b-a95e-4546-90a5-d05f97051c75	en	Laser Printer Color	Wireless, Duplex printing
7f5965ee-8d38-47d4-9806-a1a0bcfecddc	8a72029b-a95e-4546-90a5-d05f97051c75	es	Impresora Láser Color	Inalámbrica, Impresión a doble cara
2160b126-cbf0-48e4-87ec-bc4e9096dc01	c4646a1c-9754-4992-83f5-389ed25b6cf1	en	IT Consulting (Hourly)	General technology consultation
585915de-219a-4a45-972e-62989d465690	c4646a1c-9754-4992-83f5-389ed25b6cf1	es	Consultoría TI (Por hora)	Consulta tecnológica general
9bf2f223-0ec6-441c-b944-24e4a460b40a	caf4bc34-7e07-4db7-85cf-c91f10d2cdf1	en	Software Development (Hourly)	Custom software development
ac3112bf-d4fc-4727-b366-99bddf9d7f26	caf4bc34-7e07-4db7-85cf-c91f10d2cdf1	es	Desarrollo de Software (Por hora)	Desarrollo de software a medida
174a422f-05c0-4d2f-aa8d-64481909ec80	692b204b-1ab9-4f04-8b72-55bc7e571480	en	Security Audit	Comprehensive system security review
9922fcfe-b784-4857-b063-96edc912557a	692b204b-1ab9-4f04-8b72-55bc7e571480	es	Auditoría de Seguridad	Revisión completa de seguridad del sistema
d2ba2da5-6561-44f7-96dd-4792065ea3fb	dc7bcf42-6d21-49df-8b97-edc14011cccb	en	Monthly Maintenance Plan	Server and infrastructure maintenance
b019ec7a-d894-4156-9141-21b54566d8b0	dc7bcf42-6d21-49df-8b97-edc14011cccb	es	Plan de Mantenimiento Mensual	Mantenimiento de servidores e infraestructura
b5e96624-d858-45eb-a4ca-cc3a260d71ab	2d69517b-1688-4892-8513-792326f67afd	en	Cloud Migration	Migration of on-premise systems to cloud
0808c787-c33c-465a-ae45-f921e76750c4	2d69517b-1688-4892-8513-792326f67afd	es	Migración a la Nube	Migración de sistemas locales a la nube
d3234a35-198f-44d7-8246-b545f648c1f3	6793d55a-a21d-4377-82ac-38107b381e4f	en	Staff Training Session	Cybersecurity awareness training
17e1cad6-ba94-4e29-a8a4-69a3019eef90	6793d55a-a21d-4377-82ac-38107b381e4f	es	Sesión de Formación de Personal	Formación en concienciación sobre ciberseguridad
e1489289-3384-4779-ae77-26f27e0b0484	ebd236c9-b1db-49ca-80e2-545b1eb0726c	en	SEO Optimization Package	Website SEO analysis and improvements
23843a8c-b53d-439f-b4e0-eefa4837ed5d	ebd236c9-b1db-49ca-80e2-545b1eb0726c	es	Paquete de Optimización SEO	Análisis y mejoras SEO para sitios web
f8c9390e-d4ee-4427-a6f5-d393742ff537	4529f1ce-acf2-4c83-a1a7-cf033e3a848b	en	Database Administration (Hourly)	Performance tuning and management
8f87a58c-6d45-44d2-a443-b4f97d487395	4529f1ce-acf2-4c83-a1a7-cf033e3a848b	es	Administración de Base de Datos (Por hora)	Ajuste de rendimiento y gestión
2a067f43-302c-49b1-b62c-2791a6d47242	d7451625-d2c0-4f98-bfe9-276e1876a0f6	en	Network Configuration (Hourly)	Setup and troubleshooting
bff54555-a4ef-4093-bf38-3188b1e31cd0	d7451625-d2c0-4f98-bfe9-276e1876a0f6	es	Configuración de Red (Por hora)	Instalación y resolución de problemas
4ad343d1-a26a-4afe-a26a-2911454b8543	d1e7cb51-8a0f-4b9c-947c-91e12f4b15f4	en	Data Recovery Service	Recovery from damaged storage media
913a06b1-7180-4115-a820-a5c1d545b612	d1e7cb51-8a0f-4b9c-947c-91e12f4b15f4	es	Servicio de Recuperación de Datos	Recuperación de medios de almacenamiento dañados
c982eb64-4f20-4270-8abe-6bf3f7c49b90	c9373766-e45c-4d4a-9db1-a98c035633a5	en	JP T4S Advance	
d72bf5fa-3f9e-4916-967c-e1da5ce25798	c9373766-e45c-4d4a-9db1-a98c035633a5	es	JP T4S Advance	
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.profiles (id, user_id, first_name, last_name, nif, phone, address_line1, address_line2, city, state_province, postal_code, country, date_of_birth, bio, avatar_url) FROM stdin;
2	2	Sergio	Prezero	90333444J			\N		\N	\N		\N	\N	\N
3	3	Test	User	12345678X		Calle San Diaego	\N		\N	\N	Spain	\N	\N	\N
5	5	Usuario1	T4S	00000001T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	6	Usuario2	T4S	000000002S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	8	User	Poland	829394234k	8992988282							2026-01-13		\N
1	1	Pepe	Gotera	89000344K		Calle Galapagar	\N		\N	\N	Spain	\N	\N	\N
4	4	Admin	User	12345678A			\N		\N	\N		\N	\N	\N
\.


--
-- Data for Name: receptor; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.receptor (id_receptor, nombre, nif, direccion, email, telefono, created_at, updated_at) FROM stdin;
91b02399-fd7f-404b-911d-c959b8a008f9	Moeve	r4342334234	Test	test@moeve.com	765464564	2025-11-24 20:28:29.150999	2025-11-24 20:28:29.150999
9af4c53e-ffd0-4af2-aca0-a77a99adf272	Carlos Iván Prieto Rubio	2343243424	Avda. de Europa 1, edificio B	carlos.prieto@t4sadvance.com	638667723	2025-11-26 15:40:25.044234	2025-11-26 15:40:25.044234
9a76e580-0aaa-445e-bb22-cf354dd5b224	T4S Advanced	B992882323	Avenida Europa 1	test@t4sadcvance.com	91828323	2025-11-26 15:40:25.044234	2025-11-26 15:40:25.044234
0e78ddc4-7c3c-4b71-88b2-6943526fe4e0	 LA FARGA SA	A08980088	CALLE LAGASCA, 130 - PISO 1 IZ	suppot@lafarga.com	901123223	2025-11-26 15:50:53.707747	2025-11-26 15:50:53.707747
1bf0ae00-8719-4211-aeba-a770dabb57a1	VASS USA	99239390K	Denver 	vass-usa@vass.com	9918829128928	2025-12-10 17:46:59.601096	2025-12-10 17:46:59.601096
77ed7abd-7bc5-4c5d-9f69-8f5b69d12d49	VASS FRANCE	99230239K	Rua Les Corts	france@vasscompanu.fr	92212312323	2026-01-19 22:14:46.366433	2026-01-19 22:14:46.366433
f5720462-0cea-4c89-a628-82b491083030	REPSOL	A78374725	Mendez Alvaro	test@repsol.com	918829923	2025-11-24 20:13:00.977567	2026-01-24 10:44:37.494519
7f9718fb-3337-49b1-8446-b03d8d3a5e72	CLIENTE PRUEBA SA	A87654321	Avda Cliente 456	\N	\N	2026-01-25 20:08:46.876403	2026-01-25 20:08:46.876403
\.


--
-- Data for Name: rol_profile_auth_objects; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.rol_profile_auth_objects (profile_id, auth_object_id) FROM stdin;
1	11
1	15
2	1
2	2
2	3
2	4
2	5
2	6
2	7
2	8
2	9
2	10
2	11
2	12
2	13
2	14
2	15
2	16
2	17
2	18
2	19
2	20
2	21
2	22
2	23
2	24
2	25
2	26
2	27
2	28
2	29
2	30
2	31
2	32
2	33
2	34
2	35
2	36
2	37
2	38
2	39
2	40
\.


--
-- Data for Name: rol_profiles; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.rol_profiles (id, name, description, created_at) FROM stdin;
1	PROFILE_USER_POLAND		2025-12-30 14:35:51.094952
2	PROFILE_ADMIN	Full Access Admin Profile	2026-01-04 22:24:53.882129
\.


--
-- Data for Name: role_rol_profiles; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.role_rol_profiles (role_id, profile_id) FROM stdin;
2	1
4	1
1	2
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.roles (id, name, description) FROM stdin;
1	admin	Administrator with full access
2	user	Standard user
3	dev	Developer
4	user_poland	Rol for Poland's standard user 
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.users (id, email, password_hash, role_id, created_at, is_active, last_connection, is_online) FROM stdin;
3	testuser@example.com	$2b$10$OxXEC/dm8del8nQBsy2HfeQPfttR6mgiK6/sSeH6.eQF1fwVR/OpW	2	2025-11-23 21:57:13.992901	t	\N	f
2	carlos_ivanprieto_rubio@hotmail.com	$2b$10$jTYhttgFbQZrBDfWW61OKOFi4Vd.HLy1hSRFGulSQ/cUdlqakypGG	2	2025-11-23 09:55:51.633324	t	\N	f
6	usuario2@t4s.com	$2b$10$4VQVEuIwp/ZDDHsrK.w8duYs3AI7eSlzeMMdeu.9uXhaEzNARvUKK	2	2025-12-20 23:25:36.478391	f	\N	f
8	user_poland@einvoice.com	$2b$10$JTnrskTBLUNz2Pf4WStT2.oYj5kvjKCpiGaZKYEd.iL6T5D/ucVpa	4	2026-01-04 20:09:24.572274	f	\N	f
1	ivan.prieto@icloud.com	$2b$10$RqlHWp1RT9tqO7Op3B7BMubZjrQhaK/vH7d1bYl.BZb6ZIaBffUpa	4	2025-11-23 09:51:58.976423	t	2026-01-09 13:51:00.497012	f
5	usuario1@t4s.com	$2b$10$j5PlhCC9uULn84eWcP7.lOwUvGW4sZrJJY3NwoKwaajlsci6pwL/C	2	2025-12-20 23:23:56.184684	t	2026-01-04 22:09:31.376976	t
4	test@example.com	$2b$10$97TDbb1OIBcZ58MVdi6AuOef.VtT2hfEB1FAc7Ld6Kju4paBl3KGO	1	2025-11-23 22:07:39.529842	t	2026-01-27 23:45:54.539733	t
\.


--
-- Data for Name: workflow_edges; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.workflow_edges (id, workflow_id, source_node_id, target_node_id, label, condition, created_at) FROM stdin;
c3c3141a-b104-49d5-a3d2-073949aa4341	bf124e24-55cc-45ce-be31-f849862d59f8	59cdfe77-3a81-4836-b2e8-9788ebd9f814	7cf4d4f9-fe0c-47f9-be17-1004d203e4b4		{}	2025-11-25 16:11:43.5934+01
fe24681f-422a-4db6-ac22-9fbdf6416ff6	bf124e24-55cc-45ce-be31-f849862d59f8	7cf4d4f9-fe0c-47f9-be17-1004d203e4b4	e75433e9-723c-447a-b9b8-f4a694df3772		{}	2025-11-25 16:11:43.5934+01
681cda9a-11cc-45f5-824e-b7f21d59099c	8086974a-781f-495b-b943-e035430dd0d8	fbaf2a0f-d8f3-4756-8587-57974740248b	8d3b3e82-dfdd-43fe-a03e-34f03816868b		{}	2025-11-25 16:13:03.787495+01
c4bb69d0-88f3-413a-9c3e-01f4b6bcde10	8086974a-781f-495b-b943-e035430dd0d8	8d3b3e82-dfdd-43fe-a03e-34f03816868b	cfc728c8-5ba5-46e6-878d-3665e8ce4ba5		{}	2025-11-25 16:13:03.787495+01
7808799f-7f6a-47f4-8770-b439d82b903a	661eb1a9-ba6b-4852-8930-f532b1fb0a71	83d5cf1d-a346-4f85-98b3-3e1cabca228b	e1b1ba35-6915-4b00-b1f6-3d6443442677		{}	2025-11-25 16:15:33.915446+01
1cbcf98e-2c8f-46e4-b457-3e09470bdfce	661eb1a9-ba6b-4852-8930-f532b1fb0a71	83d5cf1d-a346-4f85-98b3-3e1cabca228b	a54df981-0b48-4031-9199-03f48531acc4		{}	2025-11-25 16:15:33.915446+01
f8bff2d8-2b13-447b-9345-22202151be5c	661eb1a9-ba6b-4852-8930-f532b1fb0a71	e1b1ba35-6915-4b00-b1f6-3d6443442677	1777c370-b9a4-465f-baf0-4388dbc9edb4		{}	2025-11-25 16:15:33.915446+01
3a91e2aa-02e0-4d03-a08f-a7834c28fde5	661eb1a9-ba6b-4852-8930-f532b1fb0a71	a54df981-0b48-4031-9199-03f48531acc4	1777c370-b9a4-465f-baf0-4388dbc9edb4		{}	2025-11-25 16:15:33.915446+01
22643a21-89d6-4c88-99ca-fcf848ef1ba6	359c05dc-577d-48be-9168-0d108922e4ba	de0e9bb9-7785-469a-adea-b806779182d6	d4799c87-93c0-40a2-bb6f-1d4275edc313		{}	2025-11-25 16:23:16.420759+01
7ea5670d-2824-4bee-ac03-09597fe61d49	359c05dc-577d-48be-9168-0d108922e4ba	d4799c87-93c0-40a2-bb6f-1d4275edc313	a7d94610-b44f-4806-b2e9-e4464d94ba68		{}	2025-11-25 16:23:16.420759+01
1a3594fa-e97f-4c82-a2ce-3a24a53b0a13	80020a1c-2a28-40d4-9a87-b075c2039b32	f578939b-9f91-4453-95fe-474ef2bfd182	43f25fc2-9b40-4475-8771-c2e13a457f69		{}	2025-11-26 17:07:35.894907+01
1d1553f0-6b75-4a96-a1ec-73ceb7326262	80020a1c-2a28-40d4-9a87-b075c2039b32	43f25fc2-9b40-4475-8771-c2e13a457f69	bd3ebc98-9cf9-49ec-b536-44a5320bde31		{}	2025-11-26 17:07:35.894907+01
4722567c-bb5e-49d6-b004-45187664feab	80020a1c-2a28-40d4-9a87-b075c2039b32	bd3ebc98-9cf9-49ec-b536-44a5320bde31	4ce0ea17-afb7-4242-8785-b26b08729136		{}	2025-11-26 17:07:35.894907+01
\.


--
-- Data for Name: workflow_nodes; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.workflow_nodes (id, workflow_id, type, label, properties, "position", created_at) FROM stdin;
59cdfe77-3a81-4836-b2e8-9788ebd9f814	bf124e24-55cc-45ce-be31-f849862d59f8	START	New START	{}	{"x": 50, "y": 50}	2025-11-25 16:11:43.5934+01
7cf4d4f9-fe0c-47f9-be17-1004d203e4b4	bf124e24-55cc-45ce-be31-f849862d59f8	TASK	New TASK	{}	{"x": 280, "y": 80}	2025-11-25 16:11:43.5934+01
e75433e9-723c-447a-b9b8-f4a694df3772	bf124e24-55cc-45ce-be31-f849862d59f8	END	New END	{}	{"x": 540, "y": 100}	2025-11-25 16:11:43.5934+01
fbaf2a0f-d8f3-4756-8587-57974740248b	8086974a-781f-495b-b943-e035430dd0d8	START	New START	{}	{"x": 50, "y": 50}	2025-11-25 16:13:03.787495+01
8d3b3e82-dfdd-43fe-a03e-34f03816868b	8086974a-781f-495b-b943-e035430dd0d8	DECISION	New DECISION	{}	{"x": 280, "y": 100}	2025-11-25 16:13:03.787495+01
cfc728c8-5ba5-46e6-878d-3665e8ce4ba5	8086974a-781f-495b-b943-e035430dd0d8	END	New END	{}	{"x": 500, "y": 100}	2025-11-25 16:13:03.787495+01
83d5cf1d-a346-4f85-98b3-3e1cabca228b	661eb1a9-ba6b-4852-8930-f532b1fb0a71	START	New START	{}	{"x": 50, "y": 50}	2025-11-25 16:15:33.915446+01
e1b1ba35-6915-4b00-b1f6-3d6443442677	661eb1a9-ba6b-4852-8930-f532b1fb0a71	TASK	New TASK	{}	{"x": 260, "y": 100}	2025-11-25 16:15:33.915446+01
a54df981-0b48-4031-9199-03f48531acc4	661eb1a9-ba6b-4852-8930-f532b1fb0a71	DECISION	New DECISION	{}	{"x": 260, "y": 180}	2025-11-25 16:15:33.915446+01
1777c370-b9a4-465f-baf0-4388dbc9edb4	661eb1a9-ba6b-4852-8930-f532b1fb0a71	END	New END	{}	{"x": 500, "y": 140}	2025-11-25 16:15:33.915446+01
de0e9bb9-7785-469a-adea-b806779182d6	359c05dc-577d-48be-9168-0d108922e4ba	START	New START	{}	{"x": 50, "y": 50}	2025-11-25 16:23:16.420759+01
d4799c87-93c0-40a2-bb6f-1d4275edc313	359c05dc-577d-48be-9168-0d108922e4ba	DECISION	New DECISION	{}	{"x": 280, "y": 60}	2025-11-25 16:23:16.420759+01
a7d94610-b44f-4806-b2e9-e4464d94ba68	359c05dc-577d-48be-9168-0d108922e4ba	END	New END	{}	{"x": 500, "y": 60}	2025-11-25 16:23:16.420759+01
f578939b-9f91-4453-95fe-474ef2bfd182	80020a1c-2a28-40d4-9a87-b075c2039b32	START	New START	{}	{"x": 60, "y": 60}	2025-11-26 17:07:35.894907+01
43f25fc2-9b40-4475-8771-c2e13a457f69	80020a1c-2a28-40d4-9a87-b075c2039b32	DECISION	New DECISION	{}	{"x": 400, "y": 120}	2025-11-26 17:07:35.894907+01
bd3ebc98-9cf9-49ec-b536-44a5320bde31	80020a1c-2a28-40d4-9a87-b075c2039b32	TASK	New TASK	{}	{"x": 620, "y": 60}	2025-11-26 17:07:35.894907+01
4ce0ea17-afb7-4242-8785-b26b08729136	80020a1c-2a28-40d4-9a87-b075c2039b32	END	New END	{}	{"x": 960, "y": 60}	2025-11-26 17:07:35.894907+01
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: iprieto
--

COPY public.workflows (id, name, description, is_active, created_at, updated_at) FROM stdin;
bf124e24-55cc-45ce-be31-f849862d59f8	Test_1	\N	f	2025-11-25 16:11:43.587599+01	2025-11-25 16:11:43.587599+01
8086974a-781f-495b-b943-e035430dd0d8	Test_2	\N	f	2025-11-25 16:13:03.782687+01	2025-11-25 16:13:03.782687+01
661eb1a9-ba6b-4852-8930-f532b1fb0a71	Test_3	\N	f	2025-11-25 16:15:33.865016+01	2025-11-25 16:15:33.865016+01
359c05dc-577d-48be-9168-0d108922e4ba	Test_4	\N	f	2025-11-25 16:23:16.411448+01	2025-11-25 16:23:16.411448+01
80020a1c-2a28-40d4-9a87-b075c2039b32	Test_5	\N	f	2025-11-26 17:07:35.879759+01	2025-11-26 17:07:35.879759+01
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 332, true);


--
-- Name: authorization_objects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.authorization_objects_id_seq', 40, true);


--
-- Name: certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.certificates_id_seq', 2, true);


--
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.countries_id_seq', 239, true);


--
-- Name: documentation_xml_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.documentation_xml_id_seq', 3, true);


--
-- Name: invoice_country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.invoice_country_id_seq', 7, true);


--
-- Name: origenes_id_origen_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.origenes_id_origen_seq', 8, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 2, true);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.profiles_id_seq', 8, true);


--
-- Name: rol_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.rol_profiles_id_seq', 2, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iprieto
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: adjunto adjunto_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.adjunto
    ADD CONSTRAINT adjunto_pkey PRIMARY KEY (id_adjunto);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: authorization_objects authorization_objects_code_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.authorization_objects
    ADD CONSTRAINT authorization_objects_code_key UNIQUE (code);


--
-- Name: authorization_objects authorization_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.authorization_objects
    ADD CONSTRAINT authorization_objects_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: documentation_xml documentation_xml_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.documentation_xml
    ADD CONSTRAINT documentation_xml_pkey PRIMARY KEY (id);


--
-- Name: emisor emisor_nif_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.emisor
    ADD CONSTRAINT emisor_nif_key UNIQUE (nif);


--
-- Name: emisor emisor_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.emisor
    ADD CONSTRAINT emisor_pkey PRIMARY KEY (id_emisor);


--
-- Name: factura factura_external_process_id_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_external_process_id_key UNIQUE (external_process_id);


--
-- Name: factura factura_id_factura_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_factura_key UNIQUE (id_factura);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (id_factura, invoice_country_id);


--
-- Name: factura factura_unica; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_unica UNIQUE (numero, serie);


--
-- Name: CONSTRAINT factura_unica ON factura; Type: COMMENT; Schema: public; Owner: iprieto
--

COMMENT ON CONSTRAINT factura_unica ON public.factura IS 'Invoice number + series must be unique';


--
-- Name: fiscal_models fiscal_models_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.fiscal_models
    ADD CONSTRAINT fiscal_models_pkey PRIMARY KEY (id);


--
-- Name: impuesto impuesto_codigo_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.impuesto
    ADD CONSTRAINT impuesto_codigo_key UNIQUE (codigo);


--
-- Name: impuesto impuesto_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.impuesto
    ADD CONSTRAINT impuesto_pkey PRIMARY KEY (id_impuesto);


--
-- Name: invoice_country invoice_country_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.invoice_country
    ADD CONSTRAINT invoice_country_pkey PRIMARY KEY (id);


--
-- Name: linea_factura linea_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.linea_factura
    ADD CONSTRAINT linea_factura_pkey PRIMARY KEY (id_linea);


--
-- Name: log_factura log_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.log_factura
    ADD CONSTRAINT log_factura_pkey PRIMARY KEY (id_log);


--
-- Name: origenes origenes_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.origenes
    ADD CONSTRAINT origenes_pkey PRIMARY KEY (id_origen);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- Name: producto_precio producto_precio_id_producto_codigo_pais_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_precio
    ADD CONSTRAINT producto_precio_id_producto_codigo_pais_key UNIQUE (id_producto, codigo_pais);


--
-- Name: producto_precio producto_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_precio
    ADD CONSTRAINT producto_precio_pkey PRIMARY KEY (id_precio);


--
-- Name: producto producto_sku_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_sku_key UNIQUE (sku);


--
-- Name: producto_traduccion producto_traduccion_id_producto_codigo_idioma_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_traduccion
    ADD CONSTRAINT producto_traduccion_id_producto_codigo_idioma_key UNIQUE (id_producto, codigo_idioma);


--
-- Name: producto_traduccion producto_traduccion_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_traduccion
    ADD CONSTRAINT producto_traduccion_pkey PRIMARY KEY (id_traduccion);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: receptor receptor_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.receptor
    ADD CONSTRAINT receptor_pkey PRIMARY KEY (id_receptor);


--
-- Name: rol_profile_auth_objects rol_profile_auth_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profile_auth_objects
    ADD CONSTRAINT rol_profile_auth_objects_pkey PRIMARY KEY (profile_id, auth_object_id);


--
-- Name: rol_profiles rol_profiles_name_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profiles
    ADD CONSTRAINT rol_profiles_name_key UNIQUE (name);


--
-- Name: rol_profiles rol_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profiles
    ADD CONSTRAINT rol_profiles_pkey PRIMARY KEY (id);


--
-- Name: role_rol_profiles role_rol_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.role_rol_profiles
    ADD CONSTRAINT role_rol_profiles_pkey PRIMARY KEY (role_id, profile_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: fiscal_models unique_model_per_period; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.fiscal_models
    ADD CONSTRAINT unique_model_per_period UNIQUE (user_id, model_type, year, period);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_edges workflow_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_pkey PRIMARY KEY (id);


--
-- Name: workflow_nodes workflow_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: idx_adjunto_factura; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_adjunto_factura ON public.adjunto USING btree (id_factura);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_emisor_nif; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_emisor_nif ON public.emisor USING btree (nif);


--
-- Name: idx_factura_created; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_created ON public.factura USING btree (created_at DESC);


--
-- Name: idx_factura_emisor; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_emisor ON public.factura USING btree (id_emisor);


--
-- Name: idx_factura_estado; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_estado ON public.factura USING btree (estado);


--
-- Name: idx_factura_external_process_id; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_external_process_id ON public.factura USING btree (external_process_id);


--
-- Name: idx_factura_fecha; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_fecha ON public.factura USING btree (fecha_emision);


--
-- Name: idx_factura_numero_serie; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_numero_serie ON public.factura USING btree (numero, serie);


--
-- Name: idx_factura_receptor; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_receptor ON public.factura USING btree (id_receptor);


--
-- Name: idx_factura_tipo; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_factura_tipo ON public.factura USING btree (tipo);


--
-- Name: idx_fiscal_models_type_period; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_fiscal_models_type_period ON public.fiscal_models USING btree (model_type, year, period);


--
-- Name: idx_fiscal_models_user; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_fiscal_models_user ON public.fiscal_models USING btree (user_id);


--
-- Name: idx_impuesto_activo; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_impuesto_activo ON public.impuesto USING btree (activo);


--
-- Name: idx_impuesto_codigo; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_impuesto_codigo ON public.impuesto USING btree (codigo);


--
-- Name: idx_linea_factura_factura; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_linea_factura_factura ON public.linea_factura USING btree (id_factura);


--
-- Name: idx_linea_factura_impuesto; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_linea_factura_impuesto ON public.linea_factura USING btree (id_impuesto);


--
-- Name: idx_log_factura; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_log_factura ON public.log_factura USING btree (id_factura);


--
-- Name: idx_log_fecha; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_log_fecha ON public.log_factura USING btree (fecha DESC);


--
-- Name: idx_log_usuario; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_log_usuario ON public.log_factura USING btree (usuario);


--
-- Name: idx_producto_precio_producto; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_producto_precio_producto ON public.producto_precio USING btree (id_producto);


--
-- Name: idx_producto_sku; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_producto_sku ON public.producto USING btree (sku);


--
-- Name: idx_producto_traduccion_producto; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_producto_traduccion_producto ON public.producto_traduccion USING btree (id_producto);


--
-- Name: idx_receptor_nif; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_receptor_nif ON public.receptor USING btree (nif);


--
-- Name: idx_workflow_edges_source; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_workflow_edges_source ON public.workflow_edges USING btree (source_node_id);


--
-- Name: idx_workflow_edges_target; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_workflow_edges_target ON public.workflow_edges USING btree (target_node_id);


--
-- Name: idx_workflow_edges_workflow_id; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_workflow_edges_workflow_id ON public.workflow_edges USING btree (workflow_id);


--
-- Name: idx_workflow_nodes_workflow_id; Type: INDEX; Schema: public; Owner: iprieto
--

CREATE INDEX idx_workflow_nodes_workflow_id ON public.workflow_nodes USING btree (workflow_id);


--
-- Name: factura trigger_log_estado_change; Type: TRIGGER; Schema: public; Owner: iprieto
--

CREATE TRIGGER trigger_log_estado_change AFTER UPDATE ON public.factura FOR EACH ROW EXECUTE FUNCTION public.log_factura_estado_change();


--
-- Name: emisor update_emisor_updated_at; Type: TRIGGER; Schema: public; Owner: iprieto
--

CREATE TRIGGER update_emisor_updated_at BEFORE UPDATE ON public.emisor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: factura update_factura_updated_at; Type: TRIGGER; Schema: public; Owner: iprieto
--

CREATE TRIGGER update_factura_updated_at BEFORE UPDATE ON public.factura FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: receptor update_receptor_updated_at; Type: TRIGGER; Schema: public; Owner: iprieto
--

CREATE TRIGGER update_receptor_updated_at BEFORE UPDATE ON public.receptor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: iprieto
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: adjunto adjunto_id_factura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.adjunto
    ADD CONSTRAINT adjunto_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: factura factura_id_emisor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_emisor_fkey FOREIGN KEY (id_emisor) REFERENCES public.emisor(id_emisor);


--
-- Name: factura factura_id_origen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_origen_fkey FOREIGN KEY (id_origen) REFERENCES public.origenes(id_origen);


--
-- Name: factura factura_id_receptor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_receptor_fkey FOREIGN KEY (id_receptor) REFERENCES public.receptor(id_receptor);


--
-- Name: fiscal_models fiscal_models_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.fiscal_models
    ADD CONSTRAINT fiscal_models_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: factura fk_invoice_country; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT fk_invoice_country FOREIGN KEY (invoice_country_id) REFERENCES public.invoice_country(id);


--
-- Name: linea_factura linea_factura_id_factura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.linea_factura
    ADD CONSTRAINT linea_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura) ON DELETE CASCADE;


--
-- Name: linea_factura linea_factura_id_impuesto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.linea_factura
    ADD CONSTRAINT linea_factura_id_impuesto_fkey FOREIGN KEY (id_impuesto) REFERENCES public.impuesto(id_impuesto);


--
-- Name: log_factura log_factura_id_factura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.log_factura
    ADD CONSTRAINT log_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: producto producto_id_impuesto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_impuesto_fkey FOREIGN KEY (id_impuesto) REFERENCES public.impuesto(id_impuesto);


--
-- Name: producto_precio producto_precio_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_precio
    ADD CONSTRAINT producto_precio_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- Name: producto_traduccion producto_traduccion_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.producto_traduccion
    ADD CONSTRAINT producto_traduccion_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rol_profile_auth_objects rol_profile_auth_objects_auth_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profile_auth_objects
    ADD CONSTRAINT rol_profile_auth_objects_auth_object_id_fkey FOREIGN KEY (auth_object_id) REFERENCES public.authorization_objects(id) ON DELETE CASCADE;


--
-- Name: rol_profile_auth_objects rol_profile_auth_objects_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.rol_profile_auth_objects
    ADD CONSTRAINT rol_profile_auth_objects_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.rol_profiles(id) ON DELETE CASCADE;


--
-- Name: role_rol_profiles role_rol_profiles_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.role_rol_profiles
    ADD CONSTRAINT role_rol_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.rol_profiles(id) ON DELETE CASCADE;


--
-- Name: role_rol_profiles role_rol_profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.role_rol_profiles
    ADD CONSTRAINT role_rol_profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: workflow_edges workflow_edges_source_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_source_node_id_fkey FOREIGN KEY (source_node_id) REFERENCES public.workflow_nodes(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_target_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_target_node_id_fkey FOREIGN KEY (target_node_id) REFERENCES public.workflow_nodes(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_nodes workflow_nodes_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: iprieto
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict aivSU1kgeCyvYw4OsEQs5VlxfkdzumGXWoy68HZRcVHvVh3H57dZOsXYJRuYnYo

