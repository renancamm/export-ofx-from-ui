//---------------------------------------------
// Scrape schemas by Bank UI
//_____________________________________________

var bankSchema = {
  neonPejota:{
    url: 'https://pejota.neon.com.br/saldo',
    listWrapper: '[data-id="balance-list"]',
    listRow: '[data-id="balance-report"]',
    itemDate: '[data-id="balance-report-future-edit-item-date"]',
    itemDateFormat: 'DD-MM-YYYY',
    itemDescription:'[data-id="balance-report-description"]',
    itemAmount: '[data-id="balance-report-value"]',
    buttonWrapper: 'body',
    buttonText: 'Export OFX',
    buttonCss: 'position:fixed; right:110px; bottom:28px; background-color:#00a5f0; padding:20px; border-radius:60px'
  },
  selected: undefined
}





//---------------------------------------------
// OFX fragments
//_____________________________________________

function ofx_addHeader() {
  return `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
`;
}

function ofx_addFooter() {
  return `
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

}

function ofx_addItem(date, amount, description) {
  return `
<STMTTRN>
<TRNTYPE>OTHER</TRNTYPE>
<DTPOSTED>${date}</DTPOSTED>
<TRNAMT>${amount}</TRNAMT>
<MEMO>${description}</MEMO>
</STMTTRN>
`;
}




//---------------------------------------------
// Utils
//_____________________________________________

function normalizeAmount(amount) {
  //Remove everything that is not a number or minus
  amount = amount.replace(/[^0-9-]/g,'');
  //Put decimals back
  amount = amount.slice(0, amount.length-2) + "." + amount.slice(-2);
  return amount
}

function normalizeDate(date) {
  //Parse date them format to ISO-like (using moment.js lib)
  return moment(date, bankSchema.selected['itemDateFormat']).format('YYYYMMDDHHmmss');
}





//---------------------------------------------
// Triggers and file generation
//_____________________________________________

function exportOfx() {
  //Add OFX header
  var ofx = ofx_addHeader();

  //Load all row itens
  var listWrapper = document.querySelector(bankSchema.selected['listWrapper']);
  var listRows = listWrapper.querySelectorAll(bankSchema.selected['listRow']);

  //Iterate each row and insert statement line with normalized data
  listRows.forEach(function(element) {
    var date = normalizeDate(element.querySelector(bankSchema.selected['itemDate']).textContent);
    var description = element.querySelector(bankSchema.selected['itemDescription']).textContent;
    var amount = normalizeAmount(element.querySelector(bankSchema.selected['itemAmount']).textContent);
    ofx += ofx_addItem(date, amount, description);
  })

  //Add OFX footer
  ofx += ofx_addFooter();

  //Trigger file download
  var link = document.createElement('a');
  link.setAttribute('href', 'data:application/x-ofx,' + encodeURIComponent(ofx));
  link.setAttribute('download', 'export.ofx');
  link.click();
}

function createButton() {
  //Create button element
  var buttonElement = document.createElement('button');
  buttonElement.innerHTML = bankSchema.selected['buttonText'];
  buttonElement.setAttribute("style", bankSchema.selected['buttonCss']);

  //Inject button element into DOM
  var buttonWrapper = document.querySelector(bankSchema.selected['buttonWrapper']);
  buttonWrapper.appendChild(buttonElement);

  //Add click listener
  buttonElement.addEventListener('click', function (event) {
    exportOfx();
  });
}





//---------------------------------------------
// Init
//_____________________________________________

//Check if url match expected scheme
function setBank() {
  var currentUrl = window.location.toString();
  for (let key in bankSchema) {
      if (currentUrl.includes(bankSchema[key]['url']) == true) {
        bankSchema.selected = bankSchema[key];
      }
  }
}

function init() {
  setBank();
  if (bankSchema.selected != undefined) {
    createButton();
  }
}

//Fire!
init();