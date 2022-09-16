package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

type Currency uint

const (
	NGN Currency = iota + 1
	INR
	USD
	EUR
)

var (
	Currency_name = map[uint]string{
		1: "NGN",
		2: "INR",
		3: "USD",
		4: "EUR",
	}
	Currency_value = map[string]uint{
		"NGN": 1,
		"INR": 2,
		"USD": 3,
		"EUR": 4,
	}
)

// String allows Currency to implement fmt.Stringer
func (c Currency) String() string {
	return Currency_name[uint(c)]
}

// Convert a string to a Currency, returns an error if the string is unknown.
func ParseCurrency(s string) (Currency, error) {
	value, ok := Currency_value[s]
	if !ok {
		return Currency(0), fmt.Errorf("%q is not a valid Currency", s)
	}
	return Currency(value), nil
}

// MarshalJSON on Currency
func (c Currency) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.String())
}

// UnmarshalJSON on Currency
func (c *Currency) UnmarshalJSON(data []byte) (err error) {
	var c_str string
	if err := json.Unmarshal(data, &c_str); err != nil {
		return err
	}
	if *c, err = ParseCurrency(c_str); err != nil {
		return err
	}
	return nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

type AssetType uint

const (
	CASH AssetType = iota + 1
	CASH_EQUIVALENT
	DEPOSIT
	INVESTMENT
	GOODWILL
	MARKETABLE_SECURITY
	ACCOUNTS_RECEIVABLE
	INVENTORY
	PPE
	VEHICLE
	FURNITURE
	LAND
	BUILDING
	PATENT
)

var (
	AssetType_name = map[uint]string{
		1:  "CASH",
		2:  "CASH_EQUIVALENT",
		3:  "DEPOSIT",
		4:  "INVESTMENT",
		5:  "GOODWILL",
		6:  "MARKETABLE_SECURITY",
		7:  "ACCOUNTS_RECEIVABLE",
		8:  "INVENTORY",
		9:  "PPE",
		10: "VEHICLE",
		11: "FURNITURE",
		12: "LAND",
		13: "BUILDING",
		14: "PATENT",
	}
	AssetType_value = map[string]uint{
		"CASH":                1,
		"CASH_EQUIVALENT":     2,
		"DEPOSIT":             3,
		"INVESTMENT":          4,
		"GOODWILL":            5,
		"MARKETABLE_SECURITY": 6,
		"ACCOUNTS_RECEIVABLE": 7,
		"INVENTORY":           8,
		"PPE":                 9,
		"VEHICLE":             10,
		"FURNITURE":           11,
		"LAND":                12,
		"BUILDING":            13,
		"PATENT":              14,
	}
)

// String allows AssetType to implement fmt.Stringer
func (a AssetType) String() string {
	return AssetType_name[uint(a)]
}

// Convert a string to a AssetType, returns an error if the string is unknown.
func ParseAssetType(s string) (AssetType, error) {
	value, ok := AssetType_value[s]
	if !ok {
		return AssetType(0), fmt.Errorf("%q is not a valid AssetType", s)
	}
	return AssetType(value), nil
}

// MarshalJSON on AssetType
func (a AssetType) MarshalJSON() ([]byte, error) {
	return json.Marshal(a.String())
}

// UnmarshalJSON on AssetType
func (a *AssetType) UnmarshalJSON(data []byte) (err error) {
	var a_str string
	if err := json.Unmarshal(data, &a_str); err != nil {
		return err
	}
	if *a, err = ParseAssetType(a_str); err != nil {
		return err
	}
	return nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// Asset describes basic details of what makes up a simple asset
type Asset struct {
	DocType   string    `json:"doc_type"` // doc_type is used to distinguish the various types of objects in state database
	ID        string    `json:"id"`
	AssetType AssetType `json:"asset_type"`
	Currency  Currency  `json:"currency"`
	Value     uint      `json:"value"`
	Owner     string    `json:"owner"`
}

type AssetReadable struct {
	ID        string `json:"id"`
	AssetType string `json:"asset_type"`
	Currency  string `json:"currency"`
	Value     uint   `json:"value"`
	Owner     string `json:"owner"`
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// InitLedger adds a base set of assets to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	assets := []Asset{
		{DocType: "bank_asset", ID: "asset-1", AssetType: CASH, Currency: NGN, Value: 1000000, Owner: "Ecobank Nigeria"},
		{DocType: "bank_asset", ID: "asset-2", AssetType: CASH_EQUIVALENT, Currency: NGN, Value: 2000000, Owner: "Access Bank"},
		{DocType: "bank_asset", ID: "asset-3", AssetType: DEPOSIT, Currency: NGN, Value: 3000000, Owner: "Zenith Bank"},
		{DocType: "bank_asset", ID: "asset-4", AssetType: INVENTORY, Currency: NGN, Value: 4000000, Owner: "First Bank of Nigeria"},
		{DocType: "bank_asset", ID: "asset-5", AssetType: INVESTMENT, Currency: NGN, Value: 5000000, Owner: "United Bank for Africa"},
		{DocType: "bank_asset", ID: "asset-6", AssetType: PATENT, Currency: NGN, Value: 6000000, Owner: "Union Bank of Nigeria"},
		{DocType: "bank_asset", ID: "asset-7", AssetType: LAND, Currency: INR, Value: 7000000, Owner: "State Bank of India"},
	}
	for _, asset := range assets {
		assetJSON, err := json.Marshal(&asset)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(asset.ID, assetJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state. %v", err)
		}
	}
	return nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// CreateAsset issues a new asset to the world state with given details.
func (s *SmartContract) CreateAsset(ctx contractapi.TransactionContextInterface, id string, asset_type string, currency string, value uint, owner string) (*AssetReadable, error) {
	// check if asset exists
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		asset, err := s.ReadAsset(ctx, id)
		if err != nil {
			return nil, fmt.Errorf("failed to read from world state: %v", err)
		}
		return asset, fmt.Errorf("the asset %s already exists", id)
	}
	// create asset and put on ledger
	at, err := ParseAssetType(asset_type)
	if err != nil {
		return nil, fmt.Errorf("error in parsing asset_type %v", err)
	}
	c, err := ParseCurrency(currency)
	if err != nil {
		return nil, fmt.Errorf("error in parsing currency %v", err)
	}
	asset := &Asset{
		DocType:   "bank_asset",
		ID:        id,
		AssetType: at,
		Currency:  c,
		Value:     value,
		Owner:     owner,
	}
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put in world state: %v", err)
	}
	return &AssetReadable{
			ID:        asset.ID,
			AssetType: asset.AssetType.String(),
			Currency:  asset.Currency.String(),
			Value:     asset.Value,
			Owner:     asset.Owner,
		},
		nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// ReadAsset returns the asset stored in the world state with given id.
func (s *SmartContract) ReadAsset(ctx contractapi.TransactionContextInterface, id string) (*AssetReadable, error) {
	queryString := fmt.Sprintf(`{"selector":{"doc_type":"bank_asset","id":"%s"}}`, id)
	// Get result iterator
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to get query result: %v", err)
	}
	defer resultsIterator.Close()
	// Iterate the result, unmarshal, append & return
	var assetsReadable []*AssetReadable
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		ar := AssetReadable{
			ID:        asset.ID,
			AssetType: asset.AssetType.String(),
			Currency:  asset.Currency.String(),
			Value:     asset.Value,
			Owner:     asset.Owner,
		}
		if err != nil {
			return nil, err
		}
		assetsReadable = append(assetsReadable, &ar)
	}
	// returning the first and only result hopefully
	return assetsReadable[0], nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// UpdateAsset updates an existing asset in the world state with provided parameters.
func (s *SmartContract) UpdateAsset(ctx contractapi.TransactionContextInterface, id string, asset_type string, currency string, value uint, owner string) (*AssetReadable, error) {
	// check if asset exists
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("the asset %s does not exist", id)
	}
	// overwriting original asset with new asset
	at, err := ParseAssetType(asset_type)
	if err != nil {
		return nil, fmt.Errorf("error in parsing asset_type %v", err)
	}
	c, err := ParseCurrency(currency)
	if err != nil {
		return nil, fmt.Errorf("error in parsing currency %v", err)
	}
	asset := &Asset{
		DocType:   "bank_asset",
		ID:        id,
		AssetType: at,
		Currency:  c,
		Value:     value,
		Owner:     owner,
	}
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put in world state: %v", err)
	}
	return &AssetReadable{
			ID:        asset.ID,
			AssetType: asset.AssetType.String(),
			Currency:  asset.Currency.String(),
			Value:     asset.Value,
			Owner:     asset.Owner,
		},
		nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// DeleteAsset deletes an given asset from the world state.
func (s *SmartContract) DeleteAsset(ctx contractapi.TransactionContextInterface, id string) (*AssetReadable, error) {
	// check if asset exists
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("the asset %s does not exist", id)
	}
	// delete asset
	asset, err := s.ReadAsset(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	err = ctx.GetStub().DelState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to delete from world state: %v", err)
	}
	return asset, nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// AssetExists returns true when asset with given ID exists in world state
func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return assetJSON != nil, nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// TransferAsset updates the owner field of asset with given id in world state.
func (s *SmartContract) TransferAsset(ctx contractapi.TransactionContextInterface, id string, newOwner string) (*AssetReadable, error) {
	asset, err := s.ReadAsset(ctx, id)
	if err != nil {
		return nil, err
	}
	// create asset from assetReadable & update new owner
	at, err := ParseAssetType(asset.AssetType)
	if err != nil {
		return nil, fmt.Errorf("error in parsing asset_type %v", err)
	}
	c, err := ParseCurrency(asset.Currency)
	if err != nil {
		return nil, fmt.Errorf("error in parsing currency %v", err)
	}
	a := &Asset{
		DocType:   "bank_asset",
		ID:        asset.ID,
		AssetType: at,
		Currency:  c,
		Value:     asset.Value,
		Owner:     newOwner,
	}
	aJSON, err := json.Marshal(a)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(id, aJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put in world state: %v", err)
	}
	return &AssetReadable{
			ID:        a.ID,
			AssetType: a.AssetType.String(),
			Currency:  a.Currency.String(),
			Value:     a.Value,
			Owner:     a.Owner,
		},
		nil
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------

// GetAllAssets returns all assets found in world state
func (s *SmartContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]*AssetReadable, error) {
	queryString := fmt.Sprintf(`{"selector":{"doc_type":"bank_asset"}}`)
	// Get result iterator
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to get query result: %v", err)
	}
	defer resultsIterator.Close()
	// Iterate the results, unmarshal, append & return
	var assetsReadable []*AssetReadable
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		ar := AssetReadable{
			ID:        asset.ID,
			AssetType: asset.AssetType.String(),
			Currency:  asset.Currency.String(),
			Value:     asset.Value,
			Owner:     asset.Owner,
		}
		if err != nil {
			return nil, err
		}
		assetsReadable = append(assetsReadable, &ar)
	}
	return assetsReadable, nil
}
