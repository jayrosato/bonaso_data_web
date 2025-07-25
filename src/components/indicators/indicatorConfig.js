export default function indicatorConfig(ids, names, meta, searchCallback, existing=null){
    let subcats = []
    let attrs = []
    const allowed_attrs = meta.required_attributes.filter(a => a==='PLWHIV')
    const allowed_attr_labels = meta.required_attribute_labels.filter(a => a==='Person Living with HIV')
    if(existing?.subcategories.length > 0){
        subcats = existing.subcategories.map((cat) => (cat))
    }
    if(existing?.required_attribute.length > 0){
        attrs = existing.required_attribute.map((a) => (a.name))
    }
    
    return [
        {name: 'code', label: 'Indicator code', type: 'text', required: true, value: existing?.code ? existing.code : ''},
        {name: 'name', label: 'Indicator Name', type: 'textarea', required: true, value: existing?.name ? existing.name : ''},
        {name: 'prerequisite_id', label: 'Prerequisite', type: 'multi-indicators', required: false, value: existing?.prerequisites ? existing.prerequisites : [], callbackText: 'Add as Prerequisite', 
            followUp: 'match_subcategories_to', followUpValue: existing?.match_subcategories_to ? existing.match_subcategories_to : '', switchpath3: existing?.match_subcategories_to ? true : false,
        },
        
        {name: 'description', label: 'Description', type: 'textarea', required: false, value: existing?.description ? existing.description : ''},
        {name: 'status', label: 'Indicator Status', type: 'select',  required: true, value: existing?.status ? existing.status : 'Active',
            constructors: {
                values: meta.statuses,
                labels: meta.statuses,
                multiple: false,
        }},
        {name: 'indicator_type', label: 'Indicator Type', type: 'select',  required: true, switchpath2: 'Respondent', value: existing?.indicator_type ? existing.indicator_type : 'Respondent',
            constructors: {
                values: meta.indicator_types,
                labels: meta.indicator_type_labels,
                multiple: false,
        }},
        {name: 'required_attribute_names', label: 'Requires Special Respondent Attribute', type: 'select',  required: false, showonpath2: true, value: existing?.required_attribute ? attrs : [],
            constructors: {
                values: meta.required_attributes,
                labels: meta.required_attribute_labels,
                multiple: true,
        }},
        {name: 'allow_repeat', label:'Allow repeat interactions (within 30 days)?', type: 'checkbox', showonpath2:true, required: false, value: existing?.allow_repeat ? true: false},
        {name: 'require_numeric', label:'Require a Numeric Value?', type: 'checkbox', required: false, value: existing?.require_numeric ? true: false},
        {name: 'require_subcategories', label: 'Require Subcategories', type: 'checkbox', required: false, value: existing?.subcategories.length>0 ? true : false, switchpath: true, hideonpath3: true},
        {name: 'governs_attribute', label: 'Set to Govern Respondent Attribute', type: 'select',  required: false, showonpath2: true, value: existing?.governs_attribute ? existing.governs_attribute : '',
            constructors: {
                values: allowed_attrs,
                labels: allowed_attr_labels,
                multiple: false,
        }},
        {name: 'subcategory_data', label: 'Subcategories', type: 'dynamic', required: false, 
            value: (existing?.subcategories.length > 0 && !existing?.match_subcategories) ? subcats : [], 
            showonpath: true, hideonpath3: true},
    ]
}