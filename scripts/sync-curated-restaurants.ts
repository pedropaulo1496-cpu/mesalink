import { PrismaClient } from "@prisma/client";
import { discoverRestaurantContact, discoverRestaurantPresentation, isEligibleRestaurantImage, isValidPublicRestaurantEmail } from "../lib/restaurant-contact-discovery";

const prisma = new PrismaClient();
const write = process.argv.includes("--write");
const cityFilter = process.argv.find((argument) => argument.startsWith("--city="))?.split("=")[1]?.toLowerCase() || "";

type Candidate = {
  id: string;
  name: string;
  city: "Lisboa" | "Porto";
  cuisine: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  contactSource?: string;
  photoSource?: string;
};

const candidates: Candidate[] = [
  { id: "lisboa-alma", name: "ALMA", city: "Lisboa", cuisine: "Cozinha portuguesa contemporânea", address: "Rua Anchieta 15, 1200-023 Lisboa", phone: "+351 213 470 650", email: "alma@almalisboa.pt", website: "https://www.almalisboa.pt/" },
  { id: "lisboa-ramiro", name: "Cervejaria Ramiro", city: "Lisboa", cuisine: "Marisqueira", address: "Avenida Almirante Reis 1-H, 1150-007 Lisboa", phone: "+351 218 851 024", email: "geral@cervejariaramiro.pt", website: "https://www.cervejariaramiro.com/", contactSource: "https://www.cervejariaramiro.com/contatos" },
  { id: "lisboa-henrique-sa-pessoa", name: "Henrique Sá Pessoa", city: "Lisboa", cuisine: "Alta cozinha portuguesa", address: "Páteo Bagatela, Travessa da Légua da Póvoa 11, 1250-138 Lisboa", phone: "+351 218 384 605", email: "reservas@henriquesapessoa.com", website: "https://www.henriquesapessoa.com/" },
  { id: "lisboa-kanazawa", name: "Kanazawa", city: "Lisboa", cuisine: "Japonesa · Kaiseki", address: "Rua Damião de Góis 3 A, 1400-086 Lisboa", phone: "+351 213 010 292", email: "reservas@kanazawa.com.pt", website: "https://kanazawa.com.pt/" },
  { id: "lisboa-sacramento", name: "Sacramento do Chiado", city: "Lisboa", cuisine: "Portuguesa contemporânea", address: "Calçada do Sacramento 44, 1200-394 Lisboa", phone: "+351 213 420 572", email: "reservas@tablegroup.pt", website: "https://www.sacramentolisboa.com/" },
  { id: "lisboa-casa-da-comida", name: "Estórias na Casa da Comida", city: "Lisboa", cuisine: "Portuguesa contemporânea", address: "Travessa das Amoreiras 1, 1250-020 Lisboa", phone: "+351 213 860 889", email: "reservas@casadacomida.pt", website: "https://www.casadacomida.pt/restaurante/" },
  { id: "lisboa-kabuki", name: "Kabuki Lisboa", city: "Lisboa", cuisine: "Japonesa", address: "Rua Castilho 77B, 1070-050 Lisboa", phone: "+351 212 491 683", email: "geral@kabukilisboa.pt", website: "https://www.kabukilisboa.pt/", contactSource: "https://www.kabukilisboa.pt/pt/contactos/" },
  { id: "lisboa-madeirense", name: "O Madeirense", city: "Lisboa", cuisine: "Madeirense · Portuguesa", address: "Amoreiras Shopping Center, Loja 3027, 1070-103 Lisboa", phone: "+351 213 830 827", email: "reservas@omadeirense.pt", website: "https://www.omadeirense.pt/", contactSource: "https://www.omadeirense.pt/contactos/" },
  { id: "lisboa-erva", name: "Erva Restaurante & Bar", city: "Lisboa", cuisine: "Portuguesa contemporânea", address: "Avenida Columbano Bordalo Pinheiro 105B, 1070-063 Lisboa", phone: "+351 912 592 132", email: "reservas@erva-restaurante.pt", website: "https://www.erva-restaurante.pt/", contactSource: "https://www.erva-restaurante.pt/reservas-e-contactos" },
  { id: "lisboa-valenciana", name: "A Valenciana", city: "Lisboa", cuisine: "Portuguesa · Grelhados", address: "Rua Marquês de Fronteira 157/163A, 1070-294 Lisboa", phone: "+351 213 884 926", email: "reservas@avalenciana.pt", website: "https://www.restauranteavalenciana.pt/" },
  { id: "porto-botanico", name: "Botânico Restaurante & Bar", city: "Porto", cuisine: "Portuguesa contemporânea", address: "Rua das Flores 135, 4050-266 Porto", phone: "+351 964 595 690", email: "reservas@botanicoporto.pt", website: "https://www.botanicoporto.pt/" },
  { id: "porto-eter", name: "Éter Restaurante & Wine Bar", city: "Porto", cuisine: "Petiscos contemporâneos · Wine bar", address: "Cais das Pedras 33, 4050-465 Porto", phone: "+351 221 156 688", email: "reservas@eter-porto.pt", website: "https://www.eter-porto.pt/" },
  { id: "porto-rebento", name: "Rebento", city: "Porto", cuisine: "Cozinha de autor", address: "Rua de São Bento da Vitória 80 RC, 4050-542 Porto", phone: "+351 224 077 800", email: "reservas@rebentorestaurante.pt", website: "https://rebentorestaurante.pt/" },
  { id: "porto-abadia", name: "Abadia do Porto", city: "Porto", cuisine: "Portuguesa tradicional", address: "Rua do Ateneu Comercial do Porto 22-24, 4000-380 Porto", phone: "+351 222 008 757", email: "geral@abadiadoporto.com", website: "https://www.abadiadoporto.com/" },
  { id: "porto-sabor-atlantiko", name: "Sabor Atlantiko", city: "Porto", cuisine: "Portuguesa", address: "Rua Oliveira Monteiro 1057, 4250-358 Porto", phone: "+351 228 314 515", email: "geral@saboratlantiko.com", website: "https://saboratlantiko.com/" },
  { id: "porto-grottu", name: "GROTTU", city: "Porto", cuisine: "Cozinha contemporânea", address: "Rua da Picaria 93, 4050-478 Porto", phone: "+351 962 180 828", email: "geral@grottu.pt", website: "https://grottu.pt/" },
  { id: "porto-ganadaria", name: "Ganadaria Steakhouse", city: "Porto", cuisine: "Steakhouse · Portuguesa", address: "Rua do Almada 426, 4050-034 Porto", phone: "+351 961 093 583", email: "geral@ganadaria.pt", website: "https://ganadaria.pt/" },
  { id: "porto-casa-da-pedra", name: "Casa da Pedra", city: "Porto", cuisine: "Portuguesa · Italiana", address: "Estrada Interior da Circunvalação 4087, 4350-114 Porto", phone: "+351 225 402 005", email: "geral@restaurantecasadapedra.pt", website: "https://restaurantecasadapedra.pt/" },
  { id: "porto-lider", name: "Restaurante Líder", city: "Porto", cuisine: "Portuguesa tradicional", address: "Alameda Eça de Queirós 120/130, 4200-272 Porto", phone: "+351 225 020 089", email: "geral@restaurantelider.com", website: "https://restaurantelider.com/" },
  { id: "porto-tokkotai", name: "Tokkotai", city: "Porto", cuisine: "Japonesa contemporânea", address: "Rua do Comércio do Porto 144, 4050-209 Porto", phone: "+351 913 037 171", email: "geral@tokkotai.pt", website: "https://www.tokkotai.pt/home-1" },
];

async function main() {
  let published = 0;
  const selectedCandidates = candidates.filter((item) => !cityFilter || item.city.toLowerCase() === cityFilter);
  for (const candidate of selectedCandidates) {
    try {
    const [contact, presentation, coordinates] = await Promise.all([
      discoverRestaurantContact(candidate.contactSource || candidate.website),
      discoverRestaurantPresentation(candidate.photoSource || candidate.website),
      geocode(candidate.address),
    ]);
    const expectedEmail = candidate.email.toLowerCase();
    const email = contact?.email === expectedEmail ? contact.email : expectedEmail;
    const heroImage = presentation?.heroImage && isEligibleRestaurantImage(presentation.heroImage) ? presentation.heroImage : "";
    const galleryImages = (presentation?.galleryImages || []).filter(isEligibleRestaurantImage).slice(0, 4);
    const eligible = isValidPublicRestaurantEmail(email) && Boolean(heroImage);
    if (eligible) published += 1;
    const data = {
      provider: "CURATED",
      placeId: `curated:${candidate.id}`,
      name: candidate.name,
      city: candidate.city,
      address: candidate.address,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      phone: candidate.phone,
      cuisine: candidate.cuisine,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.name}, ${candidate.address}`)}`,
      contactEmail: email,
      contactCheckedAt: new Date(),
      contactSourceUrl: contact?.email === expectedEmail ? contact.sourceUrl : candidate.contactSource || candidate.website,
      websiteUrl: presentation?.websiteUrl || candidate.website,
      heroImage: heroImage || null,
      photoSourceUrl: heroImage ? presentation?.websiteUrl || candidate.photoSource || candidate.website : null,
      galleryImages,
      description: presentation?.description || null,
      openingHours: presentation?.openingHours || null,
      rating: presentation?.rating ?? null,
      reviewCount: presentation?.reviewCount ?? null,
      ratingSource: presentation?.ratingSource || null,
      priceLevel: presentation?.priceLevel ?? null,
      dataSourceUrl: candidate.website,
      published: eligible,
      verifiedAt: eligible ? new Date() : null,
      enrichedAt: new Date(),
      photoCheckedAt: new Date(),
      lastSeenAt: new Date(),
    };
    if (write) {
      await prisma.externalRestaurantPlace.upsert({
        where: { placeId: data.placeId },
        create: { ...data, firstSeenAt: new Date() },
        update: data,
      });
    }
    console.log(`${eligible ? "PUBLICAR" : "IGNORAR"} | ${candidate.city} | ${candidate.name} | ${email} | ${heroImage || "sem fotografia real"}`);
    } catch (error) {
      console.error(`ERRO | ${candidate.city} | ${candidate.name} | ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(`${published}/${selectedCandidates.length} restaurantes cumprem email público + fotografia real.${write ? " Base de dados atualizada." : " Simulação; use --write para gravar."}`);
}

async function geocode(address: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "pt");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { "User-Agent": "MesaLink-Curated-Directory/1.0 (info@mesalink.pt)", Accept: "application/json" }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!response?.ok) return null;
  const result = await response.json().catch(() => []) as Array<{ lat?: string; lon?: string }>;
  const latitude = Number(result[0]?.lat);
  const longitude = Number(result[0]?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
