const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mssql = require('mssql');
const functions = require('./functions.js');

app.use(cors());
app.options('*', cors());

var jsonParser = bodyParser.json();

const server = app.listen(4000, '127.0.0.1', () => {
  let host = server.address().address;
  let port = server.address().port;
  console.log('app is listening at ', host, port);
});

functions.handleDisconnect();

app.get('/location', (req, res) => {
  mssql.connect(functions.dbConfig, (err) => {
    if (err) {
      console.error(err);
      return null;
    }
    let request = new mssql.Request();
    let query = `SELECT * FROM dbo.Location`;
    request.query(query, (err, recordset) => {
      if (err) {
        console.error(err);
        return null;
      }
      let response = recordset.recordset;
      let returnObject = {
        state: [],
        county: []
      };
      for (let i = 0; i < response.length; i++) {
        let current = response[i];
        if (current.Tier === 1) {
          returnObject.county.push(current);
        } else {
          returnObject.state.push(current);
        }
      }
      res.json(returnObject).status(200).end();
    });
  });
});

app.get('/questionnaire', (req, res) => {
  mssql.connect(functions.dbConfig, (err) => {
    if (err) {
      console.error(err);
      return null;
    }
    let request = new mssql.Request();
    let query = `SELECT * FROM [Hammer].[dbo].[SubcontractorTrade]`;
    request.query(query, (err, recordset) => {
      if (err) {
        console.error(err);
        return null;
      }
      let response = recordset.recordset;
      res.json(response).status(200).end();
    });
  });
});

app.post('/submission', jsonParser, (req, res) => {
  mssql.connect(functions.dbConfig, (err) => {
    if (err) {
      console.error(err);
      return null;
    }

    const body = req.body;
    console.log(body);
    let date = new Date();
    let dateString = date.toISOString().slice(0, 10);

    let request = new mssql.Request();

    let certificationQueryString = '';
    body.certifications.forEach(item => {
      certificationQueryString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalCertification] 
        @PrequalID, '${item}' `;
    });

    let projectSizeQueryString = '';
    body.projectSize.forEach(item => {
      projectSizeQueryString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalProjectSize]
        @PrequalID, '${item}' `;
    });

    let statesQueryString = '';
    body.states.forEach(item => {
      statesQueryString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalWorkArea]
        @PrequalID, '${item}' `;
    });

    let countiesQueryString = '';
    body.counties.forEach(item => {
      countiesQueryString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalWorkArea]
        @PrequalID, '${item}' `;
    });

    let tradesQueryString = '';
    body.trades.forEach(item => {
      tradesQueryString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalTrade]
        @PrequalID, '${item}' `;
    });

    let subcontractorPrequalLicenseString = '';
    body.subcontractorPrequalLicense.forEach(item => {
      subcontractorPrequalLicenseString +=
        `EXEC [Hammer].[dbo].[InsertSubcontractorPrequalLicense]
        @PrequalID, '${item.trade}', '${item.state}' `;
    });

    let query = `
      DECLARE @PrequalID int

      EXEC [Hammer].[dbo].[SubcontractorPrequalEntry]
      '${dateString}', '${body.company}', '${body.address}', '${body.city}', '${body.stateBusiness}',
      '${body.zip}', '${body.contractorLicenseNumber}', '${body.dirRegistrationNumber}', 
      '${body.website}', '${body.number}', '${body.employeeNumber}', '${body.name}',
      '${body.title}', '${body.email}', '${body.contactTelephone}', '${body.yearsExperienceConstruction}', 
      '${body.yearsExperiencePublicWorks}', '${body.union}', '${body.entity}', 
      '${body.lastYearRevenue}', '${body.currentYearExpectedRevenue}', 
      '${body.currentLargestProject1}', '${body.currentLargestProjectAmount1}', 
      '${body.currentLargestProject2}', '${body.currentLargestProjectAmount2}', 
      '${body.currentLargestProject3}', '${body.currentLargestProjectAmount3}', 
      '${body.largestCompletedProject1}', '${body.largestCompletedProjectAmount1}', 
      '${body.largestCompletedProject2}', '${body.largestCompletedProjectAmount2}', 
      '${body.largestCompletedProject3}', '${body.largestCompletedProjectAmount3}', 
      '${body.questionDIR}', '${body.questionInsurance}', '${body.questionWorkersComp}', 
      '${body.questionBond}', '${body.questionEMR}', '${body.questionLitigation}', '${body.questionPayments}', 
      '${body.questionClaims}', '${body.questionOSHA}', @InsertID = @PrequalID output; 

      ${certificationQueryString} 
      ${projectSizeQueryString}
      ${statesQueryString}
      ${countiesQueryString}
      ${tradesQueryString}
      ${subcontractorPrequalLicenseString}
    `;

    request.query(query, (err, recordset) => {
      if (err) {
        console.error(err);
        return null;
      }
      console.log(recordset);
      res.status(200).end();
    });

  });
});






    // let query = `
    //   INSERT INTO [Hammer].[dbo].[SubcontractorPrequal]
    //   VALUES (
    //     '${dateString}', '${body.company}', '${body.address}', '${body.city}', '${body.stateBusiness}',
    //     '${body.zip}', '${body.contractorLicenseNumber}', '${body.dirRegistrationNumber}', 
    //     '${body.website}', '${body.number}', '${body.employeeNumber}', '${body.name}',
    //     '${body.title}', '${body.email}', '${body.contactTelephone}', '${body.yearsExperienceConstruction}', 
    //     '${body.yearsExperiencePublicWorks}', '${body.union}', '${body.entity}', 
    //     '${body.lastYearRevenue}', '${body.currentYearExpectedRevenue}', 
    //     '${body.currentLargestProject1}', '${body.currentLargestProjectAmount1}', 
    //     '${body.currentLargestProject2}', '${body.currentLargestProjectAmount2}', 
    //     '${body.currentLargestProject3}', '${body.currentLargestProjectAmount3}', 
    //     '${body.largestCompletedProject1}', '${body.largestCompletedProjectAmount1}', 
    //     '${body.largestCompletedProject2}', '${body.largestCompletedProjectAmount2}', 
    //     '${body.largestCompletedProject3}', '${body.largestCompletedProjectAmount3}', 
    //     '${body.questionDIR}', '${body.questionInsurance}', '${body.questionWorkersComp}', 
    //     '${body.questionBond}', '${body.questionEMR}', '${body.questionLitigation}', '${body.questionPayments}', 
    //     '${body.questionClaims}', '${body.questionOSHA}'
    //   )
    //   DECLARE @PrequalID int
    //   SET @PrequalID = SCOPE_IDENTITY()
    //   ${certificationQueryString} 
    //   ${projectSizeQueryString}
    //   ${statesQueryString}
    //   ${countiesQueryString}
    //   ${tradesQueryString}
    //   ${subcontractorPrequalLicenseString}
    // `;