function(doc, req)
{
  return doc._deleted || doc.type == "project" || doc.type == "model";
}