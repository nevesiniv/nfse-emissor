import crypto from "node:crypto";

interface NfseXmlData {
  saleId: string;
  amount: string;
  description: string;
  serviceCode: string;
  buyerName: string;
  buyerDocument: string;
  buyerEmail?: string | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildNfseXml(data: NfseXmlData, certFingerprint: string): string {
  const now = new Date().toISOString();
  const numero = Date.now().toString().slice(-10);

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps>
    <NumeroLote>1</NumeroLote>
    <Cnpj>00000000000000</Cnpj>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="${data.saleId}">
          <Rps>
            <NumeroRps>${numero}</NumeroRps>
            <Serie>A</Serie>
            <Tipo>1</Tipo>
          </Rps>
          <DataEmissao>${now}</DataEmissao>
          <Servico>
            <ValorServicos>${data.amount}</ValorServicos>
            <ItemListaServico>${escapeXml(data.serviceCode)}</ItemListaServico>
            <Discriminacao>${escapeXml(data.description)}</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
          </Servico>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>${escapeXml(data.buyerDocument)}</CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${escapeXml(data.buyerName)}</RazaoSocial>
            ${data.buyerEmail ? `<Contato><Email>${escapeXml(data.buyerEmail)}</Email></Contato>` : ""}
          </Tomador>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;

  // Assinatura simplificada: SHA-256 hash do XML + fingerprint do certificado
  const signatureInput = xmlContent + certFingerprint;
  const signatureValue = crypto
    .createHash("sha256")
    .update(signatureInput)
    .digest("hex");

  return xmlContent.replace(
    "</EnviarLoteRpsEnvio>",
    `  <Signature>
    <SignatureValue>${signatureValue}</SignatureValue>
    <KeyInfo>${certFingerprint}</KeyInfo>
  </Signature>
</EnviarLoteRpsEnvio>`
  );
}
